import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Trash2, Search, Filter, File, X, Save, Building2, User, Briefcase, CheckCircle2, Clock, AlertCircle, TrendingUp, FileCheck, FileClock } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface Document {
  id: number;
  name: string;
  type: string;
  file_path: string;
  created_at: string;
  opportunity_id?: number;
  customer_id?: number;
  customer_name?: string;
  category: 'Empresa' | 'Vendas';
  status: 'Rascunho' | 'Enviada' | 'Finalizada';
}

interface Lead {
  id: number;
  name: string;
  company: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Empresa' | 'Vendas'>('Vendas');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Empresa' | 'Vendas'>('Vendas');
  const [type, setType] = useState('proposal');
  const [status, setStatus] = useState<'Rascunho' | 'Enviada' | 'Finalizada'>('Rascunho');
  const [selectedLeadId, setSelectedLeadId] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchLeads();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Falha ao carregar documentos');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar documentos');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (category === 'Vendas' && !selectedLeadId)) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          category,
          type,
          status: category === 'Vendas' ? status : 'Finalizada',
          customer_id: category === 'Vendas' ? Number(selectedLeadId) : null,
          file_path: 'uploads/mock-file.pdf' // Mock path
        })
      });

      if (res.ok) {
        toast.success('Documento salvo com sucesso!');
        setIsDrawerOpen(false);
        fetchDocuments();
        resetForm();
      } else {
        toast.error('Erro ao salvar documento');
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
    setCategory('Vendas');
    setType('proposal');
    setStatus('Rascunho');
    setSelectedLeadId('');
  };

  const filteredDocs = documents.filter(doc => 
    doc.category === activeTab &&
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: documents.length,
    vendas: documents.filter(d => d.category === 'Vendas').length,
    finalizadas: documents.filter(d => d.status === 'Finalizada' && d.category === 'Vendas').length,
    empresa: documents.filter(d => d.category === 'Empresa').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Documentos</h1>
          <p className="text-slate-500 text-sm">Organize propostas, contratos e arquivos internos.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          Upload de Documento
        </button>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Arquivos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Mês</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.finalizadas}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propostas Aceitas</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileClock size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.vendas - stats.finalizadas}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em Negociação</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.empresa}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arquivos Internos</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('Vendas')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'Vendas' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Briefcase size={16} />
            Propostas e Vendas
          </button>
          <button 
            onClick={() => setActiveTab('Empresa')}
            className={cn(
              "flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'Empresa' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Building2 size={16} />
            Documentos da Empresa
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto px-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Carregando seus arquivos...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white p-16 rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum documento nesta pasta</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8">Comece fazendo o upload de modelos de contrato ou propostas comerciais.</p>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
            >
              <Plus size={18} />
              Fazer Upload Agora
            </button>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={doc.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  doc.category === 'Vendas' ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-500"
                )}>
                  <File size={24} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <Download size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 truncate pr-8" title={doc.name}>{doc.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                      doc.type === 'proposal' ? "bg-amber-100 text-amber-700" : 
                      doc.type === 'contract' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {doc.type === 'proposal' ? 'Proposta' : doc.type === 'contract' ? 'Contrato' : 'Outro'}
                    </span>
                    {doc.category === 'Vendas' && (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1",
                        doc.status === 'Finalizada' ? "bg-emerald-500 text-white" : 
                        doc.status === 'Enviada' ? "bg-indigo-500 text-white" : "bg-slate-400 text-white"
                      )}>
                        {doc.status === 'Finalizada' ? <CheckCircle2 size={10} /> : doc.status === 'Enviada' ? <Clock size={10} /> : <AlertCircle size={10} />}
                        {doc.status}
                      </span>
                    )}
                  </div>
                </div>

                {doc.customer_name && (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <User size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 truncate">{doc.customer_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-50">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <span className="uppercase tracking-tighter">PDF</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Upload Drawer */}
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
                <Plus size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Novo Documento</h2>
                <p className="text-sm text-slate-500">Faça o upload e organize seus arquivos.</p>
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
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Arquivo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Proposta Comercial - Usina Central"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('Vendas')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                      category === 'Vendas' ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Briefcase size={14} />
                    Vendas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('Empresa')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2",
                      category === 'Empresa' ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Building2 size={14} />
                    Empresa
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="proposal">Proposta</option>
                    <option value="contract">Contrato</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                {category === 'Vendas' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="Rascunho">Rascunho</option>
                      <option value="Enviada">Enviada</option>
                      <option value="Finalizada">Finalizada</option>
                    </select>
                  </div>
                )}
              </div>

              {category === 'Vendas' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vincular Lead *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      required
                      className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                      value={selectedLeadId}
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                    >
                      <option value="">Selecione um lead...</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.name} ({l.company})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-all cursor-pointer bg-slate-50/50 group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Plus className="text-indigo-600" size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">Clique para selecionar arquivo</p>
                  <p className="text-xs text-slate-500">ou arraste e solte aqui (PDF, DOCX, JPG)</p>
                </div>
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
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </button>
            </div>
          </form>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
