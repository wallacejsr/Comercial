import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Info, Flame, ThermometerSnowflake, Target, X, Save, Settings, ChevronRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface Rule {
  id: number;
  name: string;
  field: string;
  operator: string;
  value: string;
  points: number;
  active: boolean;
}

const LEAD_FIELDS = [
  { id: 'cargo', label: 'Cargo / Função' },
  { id: 'setor', label: 'Setor / Segmento' },
  { id: 'origem', label: 'Origem do Lead' },
  { id: 'produtos_interesse', label: 'Produtos de Interesse' },
  { id: 'status_follow_up', label: 'Status do Follow-up' },
];

const OPERATORS = [
  { id: 'equals', label: 'É igual a' },
  { id: 'contains', label: 'Contém' },
  { id: 'not_equals', label: 'É diferente de' },
];

export default function LeadScoring() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [field, setField] = useState('');
  const [operator, setOperator] = useState('equals');
  const [value, setValue] = useState('');
  const [points, setPoints] = useState<number | ''>('');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/lead-scoring/rules', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Falha ao carregar regras');
      const data = await res.json();
      // Map legacy data if needed, or use new structure
      setRules(data.map((r: any) => ({
        ...r,
        field: r.field || 'cargo',
        operator: r.operator || 'equals',
        value: r.value || r.criteria || '',
        active: r.active !== undefined ? r.active : true
      })));
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar regras de pontuação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setField('');
    setOperator('equals');
    setValue('');
    setPoints('');
    setSelectedRule(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !field || !value || points === '') {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const url = selectedRule ? `/api/lead-scoring/rules/${selectedRule.id}` : '/api/lead-scoring/rules';
      const method = selectedRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          field,
          operator,
          value,
          points: Number(points),
          active: selectedRule ? selectedRule.active : true
        })
      });

      if (res.ok) {
        toast.success(selectedRule ? 'Regra atualizada!' : 'Regra criada com sucesso!');
        setIsDrawerOpen(false);
        fetchRules();
        resetForm();
      } else {
        toast.error('Erro ao salvar regra');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir esta regra?')) return;
    try {
      const res = await fetch(`/api/lead-scoring/rules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setRules(prev => prev.filter(r => r.id !== id));
        toast.success('Regra excluída');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditDrawer = (rule: Rule) => {
    setSelectedRule(rule);
    setName(rule.name);
    setField(rule.field);
    setOperator(rule.operator);
    setValue(rule.value);
    setPoints(rule.points);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Scoring</h1>
          <p className="text-slate-500">Defina regras para pontuar e priorizar seus leads automaticamente.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={16} />
          Nova Regra
        </button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regras Ativas</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{rules.length}</p>
          <p className="mt-2 text-xs text-slate-500">Avaliando leads em tempo real</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-orange-50 opacity-50">
            <Flame size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <Flame size={20} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Quentes</span>
            </div>
            <p className="text-2xl font-black text-slate-900">24</p>
            <p className="mt-2 text-xs font-bold text-orange-500">Score &gt; 70 pontos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-blue-50 opacity-50">
            <ThermometerSnowflake size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <ThermometerSnowflake size={20} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Frios</span>
            </div>
            <p className="text-2xl font-black text-slate-900">156</p>
            <p className="mt-2 text-xs font-bold text-blue-500">Score &lt; 30 pontos</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4 text-indigo-800 shadow-sm">
        <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
          <Info size={24} className="text-indigo-600" />
        </div>
        <div className="text-sm">
          <p className="font-bold text-base mb-1">Como funciona a pontuação?</p>
          <p className="text-indigo-700/80 leading-relaxed">
            O Lead Scoring atribui pontos aos leads com base em suas características (cargo, setor) e comportamentos. 
            Leads com maior pontuação (Quentes 🔥) devem ser priorizados pelo time comercial, pois têm maior chance de fechamento.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Regras de Pontuação</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome da Regra</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condição Lógica</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pontuação</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">Carregando regras...</p>
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <Star className="mx-auto mb-4 text-slate-300" size={40} />
                    <p className="font-bold text-slate-900 mb-1">Nenhuma regra configurada</p>
                    <p className="text-sm">Crie regras para começar a qualificar seus leads automaticamente.</p>
                  </td>
                </tr>
              ) : (
                rules.map((rule) => {
                  const fieldLabel = LEAD_FIELDS.find(f => f.id === rule.field)?.label || rule.field;
                  const operatorLabel = OPERATORS.find(o => o.id === rule.operator)?.label || rule.operator;
                  
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            rule.points > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                            <Star size={18} className={rule.points > 0 ? "fill-emerald-600" : "fill-red-600"} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{rule.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Regra Ativa</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">{fieldLabel}</span>
                          <span className="text-slate-400 italic">{operatorLabel}</span>
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold">"{rule.value}"</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1",
                            rule.points > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            {rule.points > 0 ? '+' : ''}{rule.points} pts
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditDrawer(rule)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Settings size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(rule.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Builder Drawer */}
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
                    <Star size={24} className="fill-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedRule ? 'Editar Regra' : 'Nova Regra'}
                    </h2>
                    <p className="text-sm text-slate-500">Configure a pontuação do lead.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Regra *</label>
                    <input 
                      type="text"
                      placeholder="Ex: Cargo de Diretoria"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Filter size={14} className="text-indigo-600" />
                      Condição
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Campo do Lead</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={field}
                          onChange={(e) => setField(e.target.value)}
                          required
                        >
                          <option value="">Selecione um campo...</option>
                          {LEAD_FIELDS.map(f => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Operador</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={operator}
                          onChange={(e) => setOperator(e.target.value)}
                        >
                          {OPERATORS.map(o => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Valor Esperado</label>
                        <input 
                          type="text"
                          placeholder="Ex: Diretor"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Pontuação (Positiva ou Negativa) *</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        placeholder="Ex: 20 ou -10"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={points}
                        onChange={(e) => setPoints(e.target.value ? Number(e.target.value) : '')}
                        required
                      />
                      <div className="shrink-0 px-4 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm">
                        Pontos
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Use valores negativos para penalizar leads fora do perfil.</p>
                  </div>
                </div>

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
                    <Save size={18} />
                    {saving ? 'Salvando...' : selectedRule ? 'Salvar Alterações' : 'Criar Regra'}
                  </button>
                </div>
              </form>
            </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}

