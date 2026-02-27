import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Brain, TrendingUp, AlertCircle, Lightbulb, Clock, 
  ChevronRight, History, Trash2, Zap, Target, Users, X, Info, 
  Building2, MapPin, User, Mail, Phone, ShoppingBag, Package, 
  Filter, CheckCircle2, HelpCircle, FileText, Download, File,
  Plus, Calendar, MessageSquare
} from 'lucide-react';
import Markdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface InsightHistory {
  id: string;
  prompt: string;
  response: string;
  timestamp: Date;
}

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  status: string;
  created_at: string;
  origin_id: number;
  origin_name: string;
  score: number;
  notes: string;
  data_follow_up: string;
  status_follow_up: string;
  responsavel: string;
  cargo: string;
  grupo: string;
  producao: string;
  cidade: string;
  uf: string;
  produtos_interesse: string;
  ligacao_realizada: string;
  virou_agenda: string;
  empresa_homologada: string;
}

export default function AIInsights() {
  const [prompt, setPrompt] = useState('');
  const [currentInsight, setCurrentInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<InsightHistory[]>([]);
  const [contextData, setContextData] = useState<{
    stats: any;
    leads: Lead[];
    opportunities: any[];
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lead Drawer State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'details' | 'history' | 'documents'>('details');
  const [leadDocuments, setLeadDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  useEffect(() => {
    fetchAllContext();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentInsight]);

  const fetchAllContext = async () => {
    try {
      const [statsRes, leadsRes, oppsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/leads', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/opportunities', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      const [stats, leads, opps] = await Promise.all([
        statsRes.json(),
        leadsRes.json(),
        oppsRes.json()
      ]);

      setContextData({ stats, leads, opportunities: opps });
    } catch (err) {
      console.error('Erro ao buscar contexto:', err);
    }
  };

  const fetchLeadDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const lead = await res.json();
        setSelectedLead(lead);
        setIsLeadDrawerOpen(true);
        setDrawerTab('details');
        fetchLeadDocuments(id);
      }
    } catch (err) {
      toast.error('Erro ao carregar detalhes do lead');
    }
  };

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
          notes: followUpNote 
        })
      });
      if (res.ok) {
        toast.success('Follow-up agendado!');
        setIsSchedulingFollowUp(false);
        fetchLeadDetails(selectedLead.id);
      }
    } catch (err) {
      toast.error('Erro ao agendar follow-up');
    }
  };

  const generateInsight = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt || !contextData) return;

    setLoading(true);
    setCurrentInsight('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `Você é um Consultor de Negócios Estratégico de alto nível. 
      Sua missão é analisar os dados do CRM e fornecer orientações diretas, práticas e focadas em resultados.
      
      REGRAS DE COMUNICAÇÃO:
      1. NÃO use saudações formais (ex: "Olá", "Prezado").
      2. NÃO use explicações técnicas sobre a base de dados (ex: "esclareço que a base...", "analisando os dados fornecidos...").
      3. Seja DIRETO e use TÓPICOS para organizar as informações.
      4. Use NEGRITO para destacar métricas e nomes de empresas/leads.
      5. Use ÍCONES (emojis) para tornar a leitura dinâmica.
      6. SEMPRE que citar um Lead ou Empresa que esteja na lista abaixo, use o formato de link Markdown: [Nome do Lead](lead:ID).
      
      ESTRUTURA DA RESPOSTA:
      - Comece direto com a análise dos pontos principais.
      - Termine SEMPRE com uma seção de recomendação usando a sintaxe de blockquote do Markdown:
        > 💡 **Recomendação Estratégica:** [Sua recomendação prática aqui...]
      
      LISTA DE LEADS DISPONÍVEIS (Use para criar links):
      ${contextData.leads.map(l => `- ${l.name} (ID: ${l.id}, Empresa: ${l.company})`).join('\n')}
      
      DADOS DO CRM:
      - Estatísticas: ${JSON.stringify(contextData.stats)}
      - Oportunidades: ${JSON.stringify(Array.isArray(contextData.opportunities) ? contextData.opportunities.slice(0, 15) : [])}
      `;

      const result = await ai.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        config: {
          systemInstruction,
          temperature: 0.6,
        }
      });

      let fullText = '';
      for await (const chunk of result) {
        const text = chunk.text;
        fullText += text;
        setCurrentInsight(fullText);
      }

      const newInsight: InsightHistory = {
        id: Math.random().toString(36).substr(2, 9),
        prompt: finalPrompt,
        response: fullText,
        timestamp: new Date()
      };

      setHistory(prev => [newInsight, ...prev]);
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar insight: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Gargalos do Funil",
      desc: "Onde estamos perdendo mais leads?",
      icon: AlertCircle,
      color: "amber",
      prompt: "Analise meu funil de vendas e identifique os principais gargalos. Onde estamos perdendo mais oportunidades e o que podemos fazer para mitigar isso?"
    },
    {
      title: "Estratégia de Conversão",
      desc: "Como fechar mais negócios hoje?",
      icon: TrendingUp,
      color: "emerald",
      prompt: "Com base nos leads e oportunidades atuais, qual seria a melhor estratégia de abordagem para aumentar a taxa de conversão nesta semana?"
    },
    {
      title: "Previsão de Receita",
      desc: "Análise preditiva para o próximo mês.",
      icon: Brain,
      color: "indigo",
      prompt: "Analise minhas oportunidades abertas e valores. Qual a previsão realista de faturamento para o próximo mês considerando as probabilidades de fechamento?"
    },
    {
      title: "Leads Prioritários",
      desc: "Quem devemos focar agora?",
      icon: Target,
      color: "rose",
      prompt: "Quais são os 5 leads/oportunidades com maior potencial de fechamento imediato e por quê?"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050505] text-white -m-8 p-8 overflow-hidden relative">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/20"
          >
            <Sparkles size={40} className="text-white animate-pulse" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Insights <span className="text-indigo-500">IA</span></h1>
            <p className="text-slate-400 font-medium max-w-md mx-auto">Consultoria estratégica baseada em dados reais para aceleração de vendas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Actions & Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Zap size={14} />
                Ações Rápidas
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => generateInsight(action.prompt)}
                    disabled={loading}
                    className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-left disabled:opacity-50"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      action.color === 'amber' ? "bg-amber-500/20 text-amber-500 group-hover:bg-amber-500/30" :
                      action.color === 'emerald' ? "bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/30" :
                      action.color === 'rose' ? "bg-rose-500/20 text-rose-500 group-hover:bg-rose-500/30" :
                      "bg-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500/30"
                    )}>
                      <action.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{action.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Send size={14} />
                Pergunta Personalizada
              </h3>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Como posso melhorar o atendimento dos leads de tráfego pago?"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] resize-none placeholder:text-slate-600"
                />
                <button
                  onClick={() => generateInsight()}
                  disabled={loading || !prompt}
                  className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Insight Display & History */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {(currentInsight || loading) ? (
                <motion.div
                  key="current-insight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden flex flex-col min-h-[400px]"
                >
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Lightbulb size={16} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest italic">Análise Estratégica</span>
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    )}
                  </div>
                  <div 
                    ref={scrollRef}
                    className="p-8 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar"
                  >
                    <div className="prose prose-invert prose-slate max-w-none font-sans text-base leading-relaxed text-slate-200">
                      <Markdown
                        components={{
                          blockquote: ({ node, ...props }) => (
                            <div className="mt-8 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-100 italic">
                              {props.children}
                            </div>
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="text-indigo-400 font-bold" {...props} />
                          ),
                          a: ({ node, ...props }) => {
                            const href = props.href || '';
                            if (href.startsWith('lead:')) {
                              const leadId = parseInt(href.split(':')[1]);
                              return (
                                <button 
                                  onClick={() => fetchLeadDetails(leadId)}
                                  className="text-indigo-400 font-bold hover:underline decoration-indigo-400/30 underline-offset-4"
                                >
                                  {props.children}
                                </button>
                              );
                            }
                            return <a className="text-indigo-400 hover:underline" {...props} />;
                          }
                        }}
                      >
                        {currentInsight || "Aguardando análise estratégica..."}
                      </Markdown>
                    </div>
                  </div>
                  <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors">
                        <Zap size={14} />
                        Executar Plano
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">MODEL: GEMINI-3-FLASH</span>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] border-dashed">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                    <Brain size={48} className="text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Pronto para Analisar</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">Selecione uma ação rápida ou faça uma pergunta para começar a consultoria.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-2">
                  <History size={14} />
                  Histórico Recente
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentInsight(item.response)}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white truncate max-w-[300px]">{item.prompt}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{item.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Side Drawer (Reused from Leads.tsx logic) */}
      <AnimatePresence>
        {isLeadDrawerOpen && selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLeadDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full md:w-[40%] bg-white shadow-2xl z-[70] overflow-y-auto border-l border-slate-200 text-slate-900"
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
                <button 
                  onClick={() => setIsLeadDrawerOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {drawerTab === 'details' ? (
                  <>
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
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} />
                        Próximos Passos
                      </h3>
                      {isSchedulingFollowUp ? (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-4">
                          <input 
                            type="date" 
                            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                          />
                          <textarea 
                            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                            rows={2}
                            placeholder="Notas do follow-up..."
                            value={followUpNote}
                            onChange={(e) => setFollowUpNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={handleScheduleFollowUp} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold">Confirmar</button>
                            <button onClick={() => setIsSchedulingFollowUp(false)} className="px-4 border border-indigo-200 text-indigo-600 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                          <p className="text-[10px] text-amber-600 uppercase font-bold">Próximo Contato</p>
                          <p className="text-lg font-bold text-amber-900 mb-2">
                            {selectedLead.data_follow_up ? new Date(selectedLead.data_follow_up).toLocaleDateString() : 'Não agendado'}
                          </p>
                          <button onClick={() => setIsSchedulingFollowUp(true)} className="text-xs font-bold text-indigo-600 hover:underline">Agendar Agora</button>
                        </div>
                      )}
                    </section>
                  </>
                ) : drawerTab === 'history' ? (
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} />
                      Histórico
                    </h3>
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100">
                      <div className="relative flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 z-10 border-4 border-white">
                          <Plus size={16} />
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-1">
                          <p className="text-sm font-bold text-slate-900">Lead Criado</p>
                          <p className="text-xs text-slate-500">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} />
                      Documentos
                    </h3>
                    <div className="space-y-3">
                      {loadingDocs ? (
                        <p className="text-center py-10 text-xs text-slate-500">Carregando...</p>
                      ) : leadDocuments.length === 0 ? (
                        <p className="text-center py-10 text-xs text-slate-500">Nenhum documento.</p>
                      ) : (
                        leadDocuments.map(doc => (
                          <div key={doc.id} className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <File size={18} className="text-slate-400" />
                              <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                            </div>
                            <Download size={16} className="text-slate-400" />
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
