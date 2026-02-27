import { useState, useEffect } from 'react';
import { Users, User, Mail, Phone, MessageCircle, MessageSquare, Building2, Filter, Search, Plus, X, MapPin, Briefcase, Calendar, CheckCircle2, AlertCircle, Info, Trash2, History, Clock, HelpCircle, ShoppingBag, Package, Flame, FileText, Download, File } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  origin_name: string;
  created_at: string;
  grupo?: string;
  producao?: string;
  cidade?: string;
  uf?: string;
  responsavel?: string;
  cargo?: string;
  ligacao_realizada?: string;
  virou_agenda?: string;
  empresa_homologada?: string;
  data_follow_up?: string;
  status_follow_up?: string;
  notes?: string;
  produtos_interesse?: string; // Comma separated IDs or names
  score?: number;
}

interface Product {
  id: number;
  nome: string;
  preco_unitario: number;
  categoria: string;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [producaoType, setProducaoType] = useState('');
  const [drawerTab, setDrawerTab] = useState<'details' | 'history' | 'documents'>('details');
  const [leadDocuments, setLeadDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/leads', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Falha ao carregar leads');
        setLeads(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setAllProducts(await res.json());
      } catch (err) {
        console.error(err);
      }
    };

    const fetchUsers = async () => {
      if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        try {
          const res = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) setAllUsers(await res.json());
        } catch (err) {
          console.error(err);
        }
      }
    };

    fetchLeads();
    fetchProducts();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (drawerTab === 'documents' && selectedLead) {
      fetchLeadDocuments(selectedLead.id);
    }
  }, [drawerTab, selectedLead]);

  const fetchLeadDocuments = async (leadId: number) => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/documents?customer_id=${leadId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setLeadDocuments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setDrawerTab('details');
    setIsSchedulingFollowUp(false);
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead permanentemente?')) return;
    
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        setIsDrawerOpen(false);
        toast.success('Lead excluído com sucesso');
      } else {
        toast.error('Erro ao excluir lead');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!selectedLead || !followUpDate) return;
    
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          data_follow_up: followUpDate,
          notes: followUpNote ? `${selectedLead.notes || ''}\n[Follow-up agendado]: ${followUpNote}` : selectedLead.notes
        })
      });
      
      if (res.ok) {
        const updatedLead = await res.json();
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        setSelectedLead(updatedLead);
        setIsSchedulingFollowUp(false);
        setFollowUpDate('');
        setFollowUpNote('');
        toast.success('Follow-up agendado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao agendar follow-up');
    }
  };

  if (loading) return <div>Carregando leads...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Leads</h1>
          <p className="text-slate-500">Visualize e gerencie seus contatos e potenciais clientes.</p>
        </div>
        <button 
          onClick={() => setIsNewLeadModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Novo Lead
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou empresa..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white transition-all">
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => openDrawer(lead)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 size={16} className="text-slate-400" />
                      {lead.company}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {lead.origin_name || 'Direto'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "font-bold text-sm",
                        (lead.score || 0) >= 70 ? "text-orange-600" : 
                        (lead.score || 0) <= 30 ? "text-blue-600" : "text-slate-600"
                      )}>
                        {lead.score || 0}
                      </span>
                      {(lead.score || 0) >= 70 && <Flame size={14} className="text-orange-500 fill-orange-500 animate-pulse" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <a 
                        href={`mailto:${lead.email}`}
                        className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        title="Enviar E-mail"
                      >
                        <Mail size={16} />
                      </a>
                      <a 
                        href={`https://wa.me/${lead.whatsapp?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                        title="WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                      <a 
                        href={`tel:${lead.phone}`}
                        className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="Ligar"
                      >
                        <Phone size={16} />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <Plus size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedLead && <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
        />}
        {isDrawerOpen && selectedLead && <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full md:w-[40%] bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200"
        >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-indigo-200">
                    {selectedLead.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedLead.name}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                        <Building2 size={14} />
                        {selectedLead.company}
                      </p>
                      <span className="text-slate-300">|</span>
                      <button 
                        onClick={() => {
                          if (drawerTab === 'details') setDrawerTab('history');
                          else if (drawerTab === 'history') setDrawerTab('documents');
                          else setDrawerTab('details');
                        }}
                        className={cn(
                          "text-xs font-bold flex items-center gap-1 transition-colors",
                          drawerTab !== 'details' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {drawerTab === 'details' ? <History size={14} /> : drawerTab === 'history' ? <FileText size={14} /> : <Info size={14} />}
                        {drawerTab === 'details' ? 'Ver Histórico' : drawerTab === 'history' ? 'Ver Documentos' : 'Ver Detalhes'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {drawerTab === 'details' ? (
                  <>
                    {/* Perfil da Unidade */}
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Info size={14} />
                        Perfil da Unidade
                      </h3>
                      <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Grupo</p>
                          <p className="text-sm text-slate-900 font-medium">{selectedLead.grupo || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Produção</p>
                          <p className="text-sm text-slate-900 font-medium">{selectedLead.producao || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Cidade</p>
                          <p className="text-sm text-slate-900 font-medium flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {selectedLead.cidade || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">UF</p>
                          <p className="text-sm text-slate-900 font-medium">{selectedLead.uf || '-'}</p>
                        </div>
                      </div>
                    </section>

                    {/* Informações de Contato */}
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} />
                        Informações de Contato
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Responsável / Cargo</p>
                            <p className="text-sm text-slate-900 font-medium">
                              {selectedLead.responsavel || '-'} {selectedLead.cargo ? `(${selectedLead.cargo})` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Mail size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">E-mail</p>
                            <p className="text-sm text-slate-900 font-medium">{selectedLead.email || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Phone size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Telefone / WhatsApp</p>
                            <p className="text-sm text-slate-900 font-medium">{selectedLead.phone || selectedLead.whatsapp || '-'}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Produtos de Interesse */}
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingBag size={14} />
                        Produtos de Interesse
                      </h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        {selectedLead.produtos_interesse ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedLead.produtos_interesse.split(',').map((prod, i) => (
                              <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm flex items-center gap-2">
                                <Package size={12} className="text-indigo-500" />
                                {prod.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">Nenhum produto de interesse vinculado.</p>
                        )}
                        <button className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2">
                          <Plus size={14} />
                          Vincular Produto
                        </button>
                      </div>
                    </section>

                    {/* Funil de Vendas */}
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Filter size={14} />
                        Funil de Vendas (Status Comercial)
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className={cn(
                          "p-3 rounded-xl border flex flex-col items-center text-center gap-2",
                          selectedLead.ligacao_realizada === 'Sim' ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                        )}>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Ligação</p>
                          {selectedLead.ligacao_realizada === 'Sim' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-slate-300" size={20} />}
                          <p className="text-xs font-bold text-slate-700">{selectedLead.ligacao_realizada || 'Não'}</p>
                        </div>
                        <div className={cn(
                          "p-3 rounded-xl border flex flex-col items-center text-center gap-2",
                          selectedLead.virou_agenda === 'Sim' ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100"
                        )}>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Agenda</p>
                          {selectedLead.virou_agenda === 'Sim' ? <Calendar className="text-indigo-500" size={20} /> : <AlertCircle className="text-slate-300" size={20} />}
                          <p className="text-xs font-bold text-slate-700">{selectedLead.virou_agenda || 'Não'}</p>
                        </div>
                        <div className={cn(
                          "p-3 rounded-xl border flex flex-col items-center text-center gap-2",
                          selectedLead.empresa_homologada === 'Sim' ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                        )}>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Homologada</p>
                          {selectedLead.empresa_homologada === 'Sim' ? <CheckCircle2 className="text-amber-500" size={20} /> : <AlertCircle className="text-slate-300" size={20} />}
                          <p className="text-xs font-bold text-slate-700">{selectedLead.empresa_homologada || 'Não'}</p>
                        </div>
                      </div>
                    </section>

                    {/* Próximos Passos */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Calendar size={14} />
                          Próximos Passos
                        </h3>
                        <div className="group relative">
                          <HelpCircle size={14} className="text-slate-300 cursor-help" />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl">
                            Follow-up: Acompanhamento estratégico realizado após o contato inicial para manter o interesse do cliente e avançar no funil de vendas.
                          </div>
                        </div>
                      </div>
                      
                      {isSchedulingFollowUp ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-4"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] text-indigo-600 uppercase font-bold">Nova Data</label>
                            <input 
                              type="date" 
                              className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-indigo-600 uppercase font-bold">O que será feito?</label>
                            <textarea 
                              className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                              rows={2}
                              placeholder="Ex: Ligar para confirmar recebimento da proposta..."
                              value={followUpNote}
                              onChange={(e) => setFollowUpNote(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleScheduleFollowUp}
                              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => setIsSchedulingFollowUp(false)}
                              className="px-4 border border-indigo-200 text-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-white transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm shadow-amber-100/50">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-amber-200 text-amber-700 rounded-xl">
                                <Calendar size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] text-amber-600 uppercase font-bold">Data de Follow-up</p>
                                <p className="text-lg font-bold text-amber-900">
                                  {selectedLead.data_follow_up ? new Date(selectedLead.data_follow_up).toLocaleDateString() : 'Não agendado'}
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-amber-200 text-amber-700 rounded-full text-[10px] font-bold uppercase">
                              {selectedLead.status_follow_up || 'Pendente'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] text-amber-600 uppercase font-bold flex items-center gap-1">
                              <MessageSquare size={12} />
                              Observações / Notas
                            </p>
                            <div className="bg-white/50 rounded-xl p-4 text-sm text-amber-900 italic border border-amber-100/50">
                              {selectedLead.notes || 'Nenhuma observação registrada para este lead.'}
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                ) : drawerTab === 'history' ? (
                  /* Timeline / History View */
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} />
                      Linha do Tempo de Interações
                    </h3>
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                      {/* Created Event */}
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Plus size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm ml-4">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-slate-900 text-sm">Lead Criado</div>
                            <time className="font-mono text-[10px] text-indigo-500">{new Date(selectedLead.created_at).toLocaleDateString()}</time>
                          </div>
                          <div className="text-slate-500 text-xs">O lead foi adicionado ao sistema via {selectedLead.origin_name || 'Cadastro Direto'}.</div>
                        </div>
                      </div>

                      {/* Follow-up Event (if exists) */}
                      {selectedLead.data_follow_up && (
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Calendar size={16} />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-amber-100 bg-amber-50/30 shadow-sm ml-4">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-slate-900 text-sm">Follow-up Agendado</div>
                              <time className="font-mono text-[10px] text-amber-600">{new Date(selectedLead.data_follow_up).toLocaleDateString()}</time>
                            </div>
                            <div className="text-slate-500 text-xs">Próximo contato estratégico definido para esta data.</div>
                          </div>
                        </div>
                      )}

                      {/* Notes Event */}
                      {selectedLead.notes && (
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <MessageSquare size={16} />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 shadow-sm ml-4">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-slate-900 text-sm">Nota Registrada</div>
                            </div>
                            <div className="text-slate-600 text-xs italic">"{selectedLead.notes}"</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                ) : (
                  /* Documents View */
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} />
                        Documentos e Propostas
                      </h3>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                        <Plus size={12} />
                        Novo Documento
                      </button>
                    </div>

                    <div className="space-y-3">
                      {loadingDocs ? (
                        <div className="py-10 text-center">
                          <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-xs text-slate-500">Buscando arquivos...</p>
                        </div>
                      ) : leadDocuments.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                          <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                          <p className="text-xs text-slate-500">Nenhum documento vinculado a este lead.</p>
                        </div>
                      ) : (
                        leadDocuments.map((doc) => (
                          <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <File size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{doc.name}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                    doc.status === 'Finalizada' ? "bg-emerald-100 text-emerald-700" : 
                                    doc.status === 'Enviada' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {doc.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 space-y-4">
                <div className="flex gap-3">
                  <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                    <Briefcase size={16} />
                    Editar Lead
                  </button>
                  <button 
                    onClick={() => {
                      setDrawerTab('details');
                      setIsSchedulingFollowUp(true);
                    }}
                    className="flex-1 bg-white border border-indigo-200 text-indigo-600 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={16} />
                    Agendar Follow-up
                  </button>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <button 
                    onClick={() => setDrawerTab(drawerTab === 'history' ? 'details' : 'history')}
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold transition-all px-3 py-2 rounded-lg",
                      drawerTab === 'history' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <History size={16} />
                    {drawerTab === 'history' ? 'Voltar para Detalhes' : 'Ver Histórico de Interações'}
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                    Excluir Lead
                  </button>
                </div>
              </div>
            </motion.div>
        }
      </AnimatePresence>

      {/* New Lead Drawer */}
      <AnimatePresence>
        {isNewLeadModalOpen && <motion.div
          key="new-lead-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsNewLeadModalOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
        />}
        {isNewLeadModalOpen && <motion.div
          key="new-lead-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full md:w-[50%] bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200 flex flex-col"
        >
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Cadastrar Novo Lead</h2>
                    <p className="text-sm text-slate-500">Preencha as informações para adicionar um novo potencial cliente.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  
                  // Simple validation
                  const email = data.email as string;
                  const phone = data.phone as string;
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  
                  if (!data.company || !data.name || !data.email) {
                    toast.error('Preencha os campos obrigatórios (*)');
                    return;
                  }

                  if (email && !emailRegex.test(email)) {
                    toast.error('Por favor, insira um e-mail válido.');
                    return;
                  }

                  try {
                    const finalProducao = data.producao === 'Outro' ? data.producao_outro : data.producao;

                    const res = await fetch('/api/leads', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({
                        ...data,
                        producao: finalProducao,
                        ligacao_realizada: data.ligacao_realizada === 'on' ? 'Sim' : 'Não',
                        virou_agenda: data.virou_agenda === 'on' ? 'Sim' : 'Não',
                        empresa_homologada: data.empresa_homologada === 'on' ? 'Sim' : 'Não',
                      })
                    });
                    if (res.ok) {
                      const newLead = await res.json();
                      setLeads(prev => [newLead, ...prev]);
                      setIsNewLeadModalOpen(false);
                      setProducaoType('');
                      toast.success('Lead cadastrado com sucesso!');
                    } else {
                      toast.error('Erro ao cadastrar lead');
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Erro ao conectar com o servidor');
                  }
                }}
                className="p-6 space-y-8 flex-1"
              >
                {/* Bloco 1: Identificação da Unidade */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={14} />
                    Identificação da Unidade
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Grupo</label>
                      <input name="grupo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ex: Grupo Raízen" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Nome Fantasia (Empresa) *</label>
                      <input name="company" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ex: Usina Central" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Produção</label>
                      <select 
                        name="producao" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        value={producaoType}
                        onChange={(e) => setProducaoType(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        <option value="Mista">Mista</option>
                        <option value="Etanol">Etanol</option>
                        <option value="Açúcar">Açúcar</option>
                        <option value="Agro">Agro</option>
                        <option value="Outro">Outro (especificar)...</option>
                      </select>
                      {producaoType === 'Outro' && (
                        <motion.input 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          name="producao_outro" 
                          required
                          className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                          placeholder="Qual o tipo de produção?" 
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700">Cidade</label>
                        <input name="cidade" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ex: Piracicaba" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">UF</label>
                        <input name="uf" maxLength={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase" placeholder="SP" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Bloco 2: Informações de Contato */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Users size={14} />
                    Informações de Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Responsável (Nome) *</label>
                      <input name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Nome do contato" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Cargo</label>
                      <input name="cargo" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="Ex: Gerente Industrial" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">E-mail *</label>
                      <input name="email" type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Telefone / WhatsApp</label>
                      <input 
                        name="phone" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                        placeholder="(00) 00000-0000"
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length > 11) v = v.slice(0, 11);
                          if (v.length > 10) {
                            v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                          } else if (v.length > 5) {
                            v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                          } else if (v.length > 2) {
                            v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                          } else if (v.length > 0) {
                            v = v.replace(/^(\d*)/, '($1');
                          }
                          e.target.value = v;
                        }}
                      />
                    </div>
                  </div>
                </section>

                {/* Bloco 3: Gestão Comercial & Follow-up */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Filter size={14} />
                    Gestão Comercial & Follow-up
                  </h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Produtos de Interesse</label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                        name="produtos_interesse"
                        className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none"
                      >
                        <option value="">Selecione um produto...</option>
                        {allProducts.map(p => (
                          <option key={p.id} value={p.nome}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Ligação Realizada?</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="ligacao_realizada" className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Virou Agenda?</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="virou_agenda" className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Homologada?</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="empresa_homologada" className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Data de Follow-up</label>
                      <input name="data_follow_up" type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Status Follow-up</label>
                      <select name="status_follow_up" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                        <option value="Pendente">Pendente</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Aguardando retorno">Aguardando retorno</option>
                      </select>
                    </div>
                  </div>

                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Vendedor Responsável</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                          name="owner_id"
                          className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none"
                        >
                          <option value="">Selecione um vendedor...</option>
                          {allUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Observações</label>
                    <textarea name="notes" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none" placeholder="Notas importantes sobre o lead..."></textarea>
                  </div>
                </section>

                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsNewLeadModalOpen(false)}
                    className="flex-1 px-6 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Salvar Lead
                  </button>
                </div>
              </form>
            </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}
