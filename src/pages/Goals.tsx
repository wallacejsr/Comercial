import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, User, Save, AlertCircle, Plus, X, ArrowUpRight, CheckCircle2, Clock, DollarSign, Users, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface Goal {
  id: number;
  user_id: number;
  user_name: string;
  reference_month: string;
  target_value: number;
  achieved_value?: number; // Calculated field
}

interface User {
  id: number;
  name: string;
  role: string;
}

interface Opportunity {
  id: number;
  value: number;
  stage_id: number;
  owner_name: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      try {
        const [goalsRes, usersRes, oppsRes] = await Promise.all([
          fetch('/api/goals', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/opportunities', { headers })
        ]);
        
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          const oppsData = oppsRes.ok ? await oppsRes.json() : [];
          setOpportunities(oppsData);
          
          // Calculate achieved value for each goal
          // Assuming stage_id 4 is "Won" (check Pipeline.tsx or API)
          // For this demo, let's assume stage_id 4 is Won.
          const enrichedGoals = goalsData.map((goal: Goal) => {
            const achieved = oppsData
              .filter((o: Opportunity) => o.owner_name === goal.user_name && o.stage_id === 4)
              .reduce((acc: number, curr: Opportunity) => acc + curr.value, 0);
            return { ...goal, achieved_value: achieved };
          });
          
          setGoals(enrichedGoals);
        }
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (err) {
        console.error('Erro ao carregar metas:', err);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !targetValue) return;

    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: Number(selectedUser),
          reference_month: month,
          target_value: Number(targetValue)
        })
      });

      if (res.ok) {
        toast.success('Meta definida com sucesso!');
        setIsDrawerOpen(false);
        // Refresh list
        const goalsRes = await fetch('/api/goals', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const goalsData = await goalsRes.json();
        const enrichedGoals = goalsData.map((goal: Goal) => {
          const achieved = opportunities
            .filter((o: Opportunity) => o.owner_name === goal.user_name && o.stage_id === 4)
            .reduce((acc: number, curr: Opportunity) => acc + curr.value, 0);
          return { ...goal, achieved_value: achieved };
        });
        setGoals(enrichedGoals);
        setTargetValue('');
      } else {
        toast.error('Erro ao salvar meta');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const totalGoal = goals.reduce((acc, g) => acc + g.target_value, 0);
  const totalAchieved = goals.reduce((acc, g) => acc + (g.achieved_value || 0), 0);
  const globalProgress = totalGoal > 0 ? (totalAchieved / totalGoal) * 100 : 0;

  if (loading) return (
    <div className="p-12 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-500 text-sm font-medium">Carregando metas e performance...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Metas</h1>
          <p className="text-slate-500">Defina e acompanhe os objetivos de vendas da equipe.</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={16} />
          Nova Meta
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta Global</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(totalGoal)}</p>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(globalProgress, 100)}%` }}
              className="h-full bg-indigo-600"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atingido</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(totalAchieved)}</p>
          <p className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight size={14} />
            {globalProgress.toFixed(1)}% da meta total
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restante</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(Math.max(totalGoal - totalAchieved, 0))}</p>
          <p className="mt-2 text-xs text-slate-500">Faltam para bater o objetivo</p>
        </div>
      </div>

      {/* Goals List/Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Performance por Vendedor</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={14} />
            {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
              <Target className="mx-auto mb-4 opacity-20" size={48} />
              <p className="font-bold text-slate-900 mb-1">Nenhuma meta definida</p>
              <p className="text-sm">Comece definindo objetivos para sua equipe de vendas.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = goal.target_value > 0 ? ((goal.achieved_value || 0) / goal.target_value) * 100 : 0;
              return (
                <motion.div 
                  key={goal.id}
                  layoutId={`goal-${goal.id}`}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {goal.user_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{goal.user_name}</h4>
                        <p className="text-xs text-slate-500">Vendedor Sênior</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{progress.toFixed(0)}%</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Progresso</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        className={cn(
                          "h-full transition-colors",
                          progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-indigo-600" : "bg-amber-500"
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Atingido</p>
                        <p className="font-bold text-slate-900">{formatCurrency(goal.achieved_value || 0)}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Meta</p>
                        <p className="font-bold text-slate-900">{formatCurrency(goal.target_value)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500">12 Oportunidades</span>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      Ver Detalhes
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* New Goal Drawer */}
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
          className="fixed right-0 top-0 h-full w-full md:w-[400px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 flex flex-col"
        >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Nova Meta</h2>
                    <p className="text-sm text-slate-500">Defina objetivos claros para sua equipe.</p>
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
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vendedor *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                        className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        required
                      >
                        <option value="">Selecione um vendedor</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mês de Referência *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="month"
                        className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Valor da Meta (R$) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="number"
                        placeholder="Ex: 50000"
                        className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
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
                    {saving ? 'Salvando...' : 'Salvar Meta'}
                  </button>
                </div>
              </form>
            </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}
