import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Kanban, Database, Plus, Save, MessageSquare, Globe, AlertCircle, Sparkles, X, Mail, User, Shield, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'team' | 'funnel' | 'custom' | 'integrations'>('team');
  const [stages, setStages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [geminiKey, setGeminiKey] = useState('');
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'seller' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    try {
      const [stagesRes, usersRes, geminiRes] = await Promise.all([
        fetch('/api/funnel/stages', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/settings/gemini_api_key', { headers })
      ]);
      
      if (stagesRes.ok) setStages(await stagesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        if (geminiData) setGeminiKey(geminiData.valor || '');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(inviteForm)
      });
      if (res.ok) {
        toast.success(`Convite enviado com sucesso para ${inviteForm.email}`);
        setIsInviteDrawerOpen(false);
        setInviteForm({ name: '', email: '', role: 'seller' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao convidar usuário');
      }
    } catch (err) {
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Usuário removido com sucesso');
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao remover usuário');
    }
  };

  const saveGeminiKey = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ key: 'gemini_api_key', value: geminiKey })
      });
      if (res.ok) toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h1>
          <p className="text-slate-500">Personalize o CRM e gerencie sua equipe.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {[
            { id: 'team', label: 'Gestão de Equipe', icon: Users },
            { id: 'funnel', label: 'Etapas do Funil', icon: Kanban },
            { id: 'custom', label: 'Campos Customizados', icon: Database },
            { id: 'integrations', label: 'Integrações', icon: Globe },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {activeTab === 'team' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Utilizadores e Vendedores</h3>
                <button 
                  onClick={() => setIsInviteDrawerOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={14} />
                  Convidar
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome / E-mail</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                            user.role === 'admin' ? "bg-purple-100 text-purple-600" :
                            user.role === 'manager' ? "bg-blue-100 text-blue-600" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gerente' : 'Vendedor'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", user.active ? "bg-emerald-500" : "bg-amber-500")} />
                            <span className="text-xs font-medium text-slate-600">
                              {user.active ? 'Ativo' : 'Pendente'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invite Side Drawer */}
          {isInviteDrawerOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsInviteDrawerOpen(false)} />
              <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Convidar Novo Usuário</h2>
                    <p className="text-xs text-slate-500">Adicione um novo membro à sua equipe.</p>
                  </div>
                  <button onClick={() => setIsInviteDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleInvite} className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required
                          type="text"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="Ex: João da Silva"
                          value={inviteForm.name}
                          onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">E-mail Corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          required
                          type="email"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          placeholder="email@empresa.com"
                          value={inviteForm.email}
                          onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Perfil de Acesso</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                          value={inviteForm.role}
                          onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                        >
                          <option value="seller">Vendedor (USER)</option>
                          <option value="manager">Gerente (MANAGER)</option>
                          <option value="admin">Administrador (ADMIN)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsInviteDrawerOpen(false)}
                      className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                    >
                      Enviar Convite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Configuração do Pipeline</h3>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                  <Plus size={14} />
                  Nova Etapa
                </button>
              </div>
              <div className="space-y-3">
                {stages.map(stage => (
                  <div key={stage.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full" style={{backgroundColor: stage.color}} />
                      <span className="font-bold text-slate-900">{stage.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">{stage.probability}% prob.</span>
                      <button className="text-slate-400 hover:text-indigo-600"><Save size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Campos Customizados</h3>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                  <Plus size={14} />
                  Novo Campo
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs text-amber-700">
                  Adicione campos específicos para Leads ou Oportunidades que não existem por padrão no sistema.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">Entidade: Leads</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Segmento de Mercado</span>
                    <span className="text-slate-400 italic">Texto</span>
                  </div>
                </div>
                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">Entidade: Oportunidades</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Urgência</span>
                    <span className="text-slate-400 italic">Seleção (Baixa, Média, Alta)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="text-indigo-500" size={20} />
                  Inteligência Artificial
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                    <input 
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Coloque sua chave do Google Gemini aqui..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Outras IAs (OpenAI/Anthropic)</label>
                    <input 
                      type="password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Chave de API para outras integrações..."
                    />
                  </div>
                  <button 
                    onClick={saveGeminiKey}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                  >
                    Salvar Chaves
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="text-emerald-500" size={20} />
                  WhatsApp Quick Reply
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem Padrão de Abordagem</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      rows={3}
                      placeholder="Olá {{nome}}, vi que você se interessou pela {{empresa}}..."
                    />
                  </div>
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all">
                    Salvar Configuração
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Globe className="text-blue-500" size={20} />
                  API de Entrada de Leads (Webhook)
                </h3>
                <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  <p className="text-emerald-400 mb-2"># Endpoint para receber leads externos</p>
                  <p>POST /api/webhooks/leads</p>
                  <p className="mt-4 text-slate-500">{"{"}</p>
                  <p className="ml-4">"name": "Nome do Lead",</p>
                  <p className="ml-4">"email": "lead@email.com",</p>
                  <p className="ml-4">"whatsapp": "5511999999999"</p>
                  <p className="text-slate-500">{"}"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
