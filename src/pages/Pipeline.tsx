import { useState, useEffect, useRef } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreVertical, DollarSign, Calendar, User, Filter } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface Opportunity {
  id: number;
  customer_name: string;
  customer_company: string;
  value: number;
  stage_id: number;
  owner_name: string;
  forecast_date: string;
}

interface Stage {
  id: number;
  name: string;
  probability: number;
  color: string;
}

export default function Pipeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      try {
        const [stagesRes, oppsRes] = await Promise.all([
          fetch('/api/funnel/stages', { headers }),
          fetch('/api/opportunities', { headers })
        ]);
        
        if (stagesRes.status === 401 || stagesRes.status === 403 || oppsRes.status === 401 || oppsRes.status === 403) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.reload();
          return;
        }
        
        if (stagesRes.ok) setStages(await stagesRes.json());
        if (oppsRes.ok) setOpportunities(await oppsRes.json());
      } catch (err) {
        console.error('Erro ao carregar pipeline:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'OPPORTUNITY_MOVED') {
        setOpportunities(prev => prev.map(o => 
          o.id === data.id ? { ...o, stage_id: data.stage_id } : o
        ));
      }
    };
    return () => socket.close();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(Number(active.id.toString().replace('opp-', '')));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    if (!activeIdStr.startsWith('opp-')) return;

    const activeOppId = Number(activeIdStr.replace('opp-', ''));
    
    let overStageId: number | null = null;
    if (overIdStr.startsWith('stage-')) {
      overStageId = Number(overIdStr.replace('stage-', ''));
    } else if (overIdStr.startsWith('opp-')) {
      const overOppId = Number(overIdStr.replace('opp-', ''));
      overStageId = opportunities.find(o => o.id === overOppId)?.stage_id || null;
    }

    if (overStageId && opportunities.find(o => o.id === activeOppId)?.stage_id !== overStageId) {
      setOpportunities(prev => prev.map(o => 
        o.id === activeOppId ? { ...o, stage_id: overStageId! } : o
      ));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    if (!activeIdStr.startsWith('opp-')) return;
    const oppId = Number(activeIdStr.replace('opp-', ''));

    let overStageId: number | null = null;
    if (overIdStr.startsWith('stage-')) {
      overStageId = Number(overIdStr.replace('stage-', ''));
    } else if (overIdStr.startsWith('opp-')) {
      const overOppId = Number(overIdStr.replace('opp-', ''));
      overStageId = opportunities.find(o => o.id === overOppId)?.stage_id || null;
    }

    if (overStageId) {
      // Update backend
      await fetch(`/api/opportunities/${oppId}/stage`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ stage_id: overStageId })
      });

      // Notify others
      socketRef.current?.send(JSON.stringify({ type: 'OPPORTUNITY_MOVED', id: oppId, stage_id: overStageId }));
    }
  };

  if (loading) return <div>Loading pipeline...</div>;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline de Vendas</h1>
          <p className="text-slate-500">Gerencie suas oportunidades e acompanhe o progresso do funil.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            Filtros
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} />
            Nova Oportunidade
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 h-full min-w-max">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {stages.map(stage => (
              <Column 
                key={stage.id} 
                stage={stage} 
                opportunities={opportunities.filter(o => o.stage_id === stage.id)} 
              />
            ))}
            <DragOverlay>
              {activeId ? (
                <OpportunityCard 
                  opportunity={opportunities.find(o => o.id === activeId)!} 
                  isOverlay 
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

interface ColumnProps {
  key?: any;
  stage: Stage;
  opportunities: Opportunity[];
}

function Column({ stage, opportunities }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
  });
  const totalValue = opportunities.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div 
      ref={setNodeRef}
      className="w-80 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200"
    >
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
            {stage.name}
          </h3>
          <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
            {opportunities.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{stage.probability}% prob.</span>
          <span className="font-semibold text-slate-700">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <SortableContext items={opportunities.map(o => `opp-${o.id}`)} strategy={verticalListSortingStrategy}>
          {opportunities.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </SortableContext>
        <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-500 transition-all">
          + Adicionar
        </button>
      </div>
    </div>
  );
}

interface OpportunityCardProps {
  key?: any;
  opportunity: Opportunity;
  isOverlay?: boolean;
}

function OpportunityCard({ opportunity, isOverlay }: OpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `opp-${opportunity.id}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all group",
        isOverlay && "shadow-xl border-indigo-500 rotate-2 scale-105"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
            {opportunity.customer_name}
          </h4>
          <p className="text-xs text-slate-500">{opportunity.customer_company}</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
          <DollarSign size={12} />
          {formatCurrency(opportunity.value)}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(opportunity.forecast_date).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1">
          <User size={12} />
          {opportunity.owner_name}
        </div>
      </div>
    </div>
  );
}
