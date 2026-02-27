import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Filter, Calendar, MessageCircle, X, User, Briefcase, ChevronRight, Search, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface Task {
  id: number;
  titulo: string;
  descricao: string;
  data_vencimento: string;
  concluida: boolean;
  tipo: 'Ligação' | 'Follow-up' | 'E-mail' | 'Reunião' | 'Outro';
  lead_id?: number;
  customer_name?: string;
  whatsapp?: string;
}

interface Lead {
  id: number;
  name: string;
  company: string;
  whatsapp: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'today' | 'overdue' | 'completed' | 'all'>('today');
  const [loading, setLoading] = useState(true);
  const [isNewTaskDrawerOpen, setIsNewTaskDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  useEffect(() => {
    fetchTasks();
    fetchLeads();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Erro ao carregar tarefas');
      setTasks(await res.json());
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setLeads(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, concluida: !t.concluida } : t));
        toast.success('Status da tarefa atualizado');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          lead_id: selectedLeadId ? parseInt(selectedLeadId) : null,
          concluida: false
        })
      });

      if (res.ok) {
        toast.success('Tarefa criada com sucesso!');
        setIsNewTaskDrawerOpen(false);
        fetchTasks();
      } else {
        toast.error('Erro ao criar tarefa');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas Tarefas</h1>
          <p className="text-slate-500">Acompanhe seus afazeres e follow-ups com clientes.</p>
        </div>
        <button 
          onClick={() => setIsNewTaskDrawerOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={16} />
          Nova Tarefa
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          {[
            { id: 'today', label: 'Hoje', icon: Clock },
            { id: 'overdue', label: 'Atrasadas', icon: AlertCircle },
            { id: 'completed', label: 'Concluídas', icon: CheckCircle2 },
            { id: 'all', label: 'Todas', icon: Filter },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm">Carregando tarefas...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="opacity-20" size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tudo em dia!</h3>
            <p className="text-sm max-w-xs mx-auto">Nenhuma tarefa pendente encontrada para este filtro. Aproveite para planejar seus próximos passos.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "shrink-0 transition-all transform hover:scale-110",
                    task.concluida ? "text-emerald-500" : "text-slate-300 hover:text-indigo-500"
                  )}
                >
                  {task.concluida ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      task.tipo === 'Ligação' ? "bg-blue-50 text-blue-600" :
                      task.tipo === 'Follow-up' ? "bg-amber-50 text-amber-600" :
                      task.tipo === 'Reunião' ? "bg-indigo-50 text-indigo-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {task.tipo}
                    </span>
                    <h4 className={cn("font-bold text-slate-900 truncate text-sm", task.concluida && "line-through text-slate-400")}>
                      {task.titulo}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(task.data_vencimento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    {task.customer_name && (
                      <p className="text-[11px] text-indigo-600 font-bold flex items-center gap-1">
                        <User size={12} />
                        {task.customer_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(task.tipo === 'Ligação' || task.tipo === 'Follow-up') && task.whatsapp && (
                    <a 
                      href={`https://wa.me/${task.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm"
                      title="Abrir WhatsApp"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Drawer */}
      <AnimatePresence>
        {isNewTaskDrawerOpen && <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsNewTaskDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
        />}
        {isNewTaskDrawerOpen && <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full md:w-[40%] bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 flex flex-col"
        >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Nova Tarefa</h2>
                    <p className="text-sm text-slate-500">Agende uma atividade para não esquecer.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsNewTaskDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Título da Tarefa *</label>
                    <input 
                      name="titulo" 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                      placeholder="Ex: Ligar para confirmar proposta" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Tipo *</label>
                      <select 
                        name="tipo" 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        <option value="Ligação">Ligação</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="E-mail">E-mail</option>
                        <option value="Reunião">Reunião</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Vencimento *</label>
                      <input 
                        name="data_vencimento" 
                        type="datetime-local" 
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Vincular a um Lead</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <select 
                        value={selectedLeadId}
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                        className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                      >
                        <option value="">Nenhum lead selecionado</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={lead.id}>
                            {lead.name} ({lead.company})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Descrição / Notas</label>
                    <textarea 
                      name="descricao" 
                      rows={4} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" 
                      placeholder="Detalhes adicionais sobre a tarefa..."
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsNewTaskDrawerOpen(false)}
                    className="flex-1 px-6 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Criar Tarefa
                  </button>
                </div>
              </form>
            </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}
