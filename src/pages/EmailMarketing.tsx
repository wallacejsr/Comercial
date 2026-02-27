import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, Plus, Eye, List, Filter, Layout, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Campaign {
  id: number;
  titulo: string;
  assunto: string;
  conteudo_html: string;
  status: string;
  total_destinatarios: number;
  enviados: number;
  stage_name?: string;
  created_at: string;
}

export default function EmailMarketing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [titulo, setTitulo] = useState('');
  const [assunto, setAssunto] = useState('');
  const [html, setHtml] = useState('<html>\n  <body style="font-family: sans-serif; padding: 20px;">\n    <h1>Olá {{nome}},</h1>\n    <p>Temos uma oferta especial para você!</p>\n  </body>\n</html>');
  const [selectedStage, setSelectedStage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    try {
      const [campRes, stageRes] = await Promise.all([
        fetch('/api/email/campaigns', { headers }),
        fetch('/api/funnel/stages', { headers })
      ]);
      
      if (campRes.ok) setCampaigns(await campRes.json());
      if (stageRes.ok) setStages(await stageRes.json());
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          titulo,
          assunto,
          conteudo_html: html,
          filtro_etapa_id: selectedStage ? Number(selectedStage) : null
        })
      });
      if (res.ok) {
        setView('list');
        fetchData();
        // Reset form
        setTitulo('');
        setAssunto('');
        setHtml('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-mail Marketing</h1>
          <p className="text-slate-500">Crie e gerencie campanhas de e-mail para seus leads.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setView(view === 'list' ? 'create' : 'list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              view === 'list' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {view === 'list' ? <><Plus size={16} /> Nova Campanha</> : <><List size={16} /> Ver Campanhas</>}
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Campanha</th>
                  <th className="px-6 py-4">Filtro</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progresso</th>
                  <th className="px-6 py-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando campanhas...</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhuma campanha criada ainda.</td></tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{camp.titulo}</p>
                        <p className="text-xs text-slate-500">{camp.assunto}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                          {camp.stage_name || 'Todos os Leads'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {camp.status === 'concluido' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-amber-500" />}
                          <span className={cn(
                            "text-[10px] font-bold uppercase",
                            camp.status === 'concluido' ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {camp.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[120px]">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>{Math.round((camp.enviados / camp.total_destinatarios) * 100 || 0)}%</span>
                            <span>{camp.enviados}/{camp.total_destinatarios}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-500" 
                              style={{ width: `${(camp.enviados / camp.total_destinatarios) * 100 || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(camp.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layout className="text-indigo-600" size={20} />
              Criar Campanha
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título Interno</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Promoção de Verão"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Público Alvo</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                  >
                    <option value="">Todos os Leads</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>Etapa: {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assunto do E-mail</label>
                <input 
                  type="text"
                  required
                  placeholder="O que o cliente verá na caixa de entrada"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Conteúdo HTML</label>
                  <span className="text-[10px] text-slate-400 font-mono">Dica: Use {"{{nome}}"} para personalizar</span>
                </div>
                <textarea 
                  required
                  className="w-full h-80 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  <Eye size={18} />
                  Visualizar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  <Send size={18} />
                  {saving ? 'Agendando...' : 'Enviar Campanha'}
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Preview Column (Desktop Only) */}
          <div className="hidden lg:flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
              <Layout size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview em Tempo Real</span>
            </div>
            <div className="flex-1 bg-slate-200 p-8 overflow-y-auto">
              <div className="bg-white w-full h-full min-h-[500px] shadow-2xl rounded-lg overflow-hidden border border-slate-300">
                <iframe 
                  title="Real-time Preview"
                  srcDoc={html.replace('{{nome}}', 'João Silva')}
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Visualização da Campanha</h3>
                  <p className="text-xs text-slate-500">Assunto: {assunto || '(Sem assunto)'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto">
              <div className="bg-white max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden min-h-full">
                <iframe 
                  title="Modal Preview"
                  srcDoc={html.replace('{{nome}}', 'João Silva')}
                  className="w-full h-full min-h-[600px] border-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
