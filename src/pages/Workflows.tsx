import { useState, useEffect } from 'react';
import { Zap, Plus, Play, Pause, Trash2, Settings, X, ArrowRight, Mail, Calendar, UserPlus, CheckCircle2, AlertCircle, MessageSquare, Bell, Clock, ChevronRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Workflow {
  id: number;
  name: string;
  trigger_event: string;
  action_type: string;
  action_details: string;
  active: boolean;
  created_at: string;
}

const TRIGGER_OPTIONS = [
  { id: 'lead_created', label: 'Novo Lead Criado', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
  { id: 'opportunity_won', label: 'Oportunidade Ganhada', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'task_overdue', label: 'Tarefa Atrasada', icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  { id: 'lead_status_changed', label: 'Status do Lead Alterado', icon: Filter, color: 'bg-amber-50 text-amber-600' },
];

const ACTION_OPTIONS = [
  { id: 'send_email', label: 'Enviar E-mail Automático', icon: Mail, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'create_task', label: 'Criar Nova Tarefa', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  { id: 'send_whatsapp', label: 'Notificar via WhatsApp', icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'internal_notification', label: 'Notificação Interna', icon: Bell, color: 'bg-slate-50 text-slate-600' },
];

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Falha ao carregar workflows');
      const data = await res.json();
      // Ensure data has the new fields for the UI
      setWorkflows(data.map((wf: any) => ({
        ...wf,
        action_type: wf.action_type || 'send_email',
        action_details: wf.action_details || 'Template de Boas-vindas'
      })));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !trigger || !action) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const url = selectedWorkflow ? `/api/workflows/${selectedWorkflow.id}` : '/api/workflows';
      const method = selectedWorkflow ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          trigger_event: trigger,
          action_type: action,
          action_details: details || 'Configuração padrão',
          active: selectedWorkflow ? selectedWorkflow.active : true
        })
      });

      if (res.ok) {
        toast.success(selectedWorkflow ? 'Workflow atualizado!' : 'Workflow criado com sucesso!');
        setIsDrawerOpen(false);
        fetchWorkflows();
        resetForm();
      } else {
        toast.error('Erro ao salvar workflow');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setTrigger('');
    setAction('');
    setDetails('');
    setSelectedWorkflow(null);
  };

  const toggleWorkflow = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        setWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, active: !currentStatus } : wf));
        toast.success(currentStatus ? 'Automação pausada' : 'Automação ativada');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWorkflow = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir esta automação?')) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setWorkflows(prev => prev.filter(wf => wf.id !== id));
        toast.success('Workflow excluído');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditDrawer = (wf: Workflow) => {
    setSelectedWorkflow(wf);
    setName(wf.name);
    setTrigger(wf.trigger_event);
    setAction(wf.action_type);
    setDetails(wf.action_details);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automação de Fluxo de Trabalho</h1>
          <p className="text-slate-500">Crie regras inteligentes para automatizar seu processo comercial.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={16} />
          Novo Workflow
        </button>
      </div>

      {/* Stats/Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total de Workflows</p>
          <p className="text-2xl font-black text-slate-900">{workflows.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ativos Agora</p>
          <p className="text-2xl font-black text-emerald-600">{workflows.filter(w => w.active).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ações Executadas (Hoje)</p>
          <p className="text-2xl font-black text-indigo-600">142</p>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Carregando automações...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-300 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma automação configurada</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Workflows ajudam você a economizar tempo automatizando tarefas como envio de e-mails, criação de lembretes e atualizações de status.
            </p>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={20} />
              Criar Primeiro Workflow
            </button>
          </div>
        ) : (
          workflows.map((wf) => {
            const triggerInfo = TRIGGER_OPTIONS.find(t => t.id === wf.trigger_event) || TRIGGER_OPTIONS[0];
            const actionInfo = ACTION_OPTIONS.find(a => a.id === wf.action_type) || ACTION_OPTIONS[0];
            
            return (
              <motion.div 
                key={wf.id} 
                layoutId={`wf-${wf.id}`}
                className={cn(
                  "bg-white p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6",
                  wf.active ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-75 grayscale-[0.5]"
                )}
              >
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className={cn("p-3 rounded-xl", triggerInfo.color)}>
                      <triggerInfo.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{wf.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">SE: {triggerInfo.label}</p>
                    </div>
                  </div>

                  <div className="hidden md:block text-slate-300">
                    <ArrowRight size={20} />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", actionInfo.color)}>
                      <actionInfo.icon size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ENTÃO</p>
                      <p className="text-sm font-bold text-slate-700">{actionInfo.label}</p>
                      <p className="text-[10px] text-slate-500 italic">{wf.action_details}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                  <div className="flex items-center gap-4 mr-4 pr-4 border-r border-slate-100">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                      <p className={cn("text-xs font-bold", wf.active ? "text-emerald-600" : "text-slate-400")}>
                        {wf.active ? 'Ativo' : 'Pausado'}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleWorkflow(wf.id, wf.active)}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-colors duration-200",
                        wf.active ? "bg-emerald-500" : "bg-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
                        wf.active ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <button 
                    onClick={() => openEditDrawer(wf)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Settings size={18} />
                  </button>
                  <button 
                    onClick={() => deleteWorkflow(wf.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Workflow Builder Drawer */}
      <AnimatePresence>
        {isDrawerOpen && <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
        />}
        {isDrawerOpen && <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 flex flex-col"
        >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedWorkflow ? 'Editar Workflow' : 'Novo Workflow'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedWorkflow ? 'Ajuste as configurações da sua automação.' : 'Automatize seu processo em segundos.'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-8 flex-1">
                {/* Step 1: Name */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">01</div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Identificação</h3>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Automação *</label>
                    <input 
                      type="text"
                      placeholder="Ex: Boas-vindas Novos Leads"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Step 2: Trigger */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">02</div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Gatilho (Trigger)</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {TRIGGER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTrigger(opt.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                          trigger === opt.id 
                            ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10" 
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", opt.color)}>
                          <opt.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                          <p className="text-[10px] text-slate-500">Sempre que este evento ocorrer...</p>
                        </div>
                        {trigger === opt.id && <CheckCircle2 size={18} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Action */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">03</div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ação (Action)</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {ACTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAction(opt.id)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                          action === opt.id 
                            ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10" 
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg", opt.color)}>
                          <opt.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                          <p className="text-[10px] text-slate-500">Execute esta ação automaticamente.</p>
                        </div>
                        {action === opt.id && <CheckCircle2 size={18} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 4: Details */}
                {action && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">04</div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Configuração da Ação</h3>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        {action === 'send_email' ? 'Template de E-mail' : 
                         action === 'create_task' ? 'Título da Tarefa' : 
                         'Detalhes Adicionais'}
                      </label>
                      <input 
                        type="text"
                        placeholder={action === 'send_email' ? 'Ex: Template Boas-vindas' : 'Ex: Ligar para novo lead'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 flex gap-3 sticky bottom-0 bg-white pb-6">
                  <button 
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 px-6 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Zap size={18} />
                    {saving ? 'Salvando...' : selectedWorkflow ? 'Salvar Alterações' : 'Criar Automação'}
                  </button>
                </div>
              </form>
            </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}
