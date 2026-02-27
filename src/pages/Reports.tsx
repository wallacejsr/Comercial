import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, Clock, AlertCircle, Award, BarChart3, 
  DollarSign, Target, ShoppingBag, Filter, Download, Calendar,
  ArrowUpRight, ArrowDownRight, Briefcase
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function Reports() {
  const [lossReasons, setLossReasons] = useState([]);
  const [sellerConversion, setSellerConversion] = useState([]);
  const [avgClosingTime, setAvgClosingTime] = useState<number | null>(null);
  const [revenueMonthly, setRevenueMonthly] = useState([]);
  const [leadsByOrigin, setLeadsByOrigin] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [advancedStats, setAdvancedStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      try {
        const [lossRes, convRes, timeRes, revRes, originRes, prodRes, statsRes] = await Promise.all([
          fetch('/api/reports/loss-reasons', { headers }),
          fetch('/api/reports/seller-conversion', { headers }),
          fetch('/api/reports/avg-closing-time', { headers }),
          fetch('/api/reports/revenue-monthly', { headers }),
          fetch('/api/reports/leads-by-origin', { headers }),
          fetch('/api/reports/product-performance', { headers }),
          fetch('/api/reports/advanced-stats', { headers })
        ]);

        const [lossData, convData, timeData, revData, originData, prodData, statsData] = await Promise.all([
          lossRes.json(),
          convRes.json(),
          timeRes.json(),
          revRes.json(),
          originRes.json(),
          prodRes.json(),
          statsRes.json()
        ]);

        setLossReasons(Array.isArray(lossData) ? lossData : []);
        setSellerConversion(Array.isArray(convData) ? convData : []);
        setAvgClosingTime(timeData.avg_days);
        setRevenueMonthly(Array.isArray(revData) ? revData : []);
        setLeadsByOrigin(Array.isArray(originData) ? originData : []);
        setProductPerformance(Array.isArray(prodData) ? prodData : []);
        setAdvancedStats(statsData);
      } catch (error) {
        console.error('Erro ao buscar dados dos relatórios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Carregando inteligência de dados...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics <span className="text-indigo-600">Estratégico</span></h1>
          <p className="text-slate-500 font-medium">Métricas de performance, conversão e saúde do pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {['7d', '30d', '90d', '12m'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  dateRange === range 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold">
              <ArrowUpRight size={12} />
              12%
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receita Total</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(advancedStats?.total_revenue || 0)}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-[10px] font-bold">
              <ArrowUpRight size={12} />
              5%
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Conversão</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {(advancedStats?.conversion_rate || 0).toFixed(1)}%
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg text-[10px] font-bold">
              <ArrowDownRight size={12} />
              2d
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tempo Médio</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {avgClosingTime ? `${avgClosingTime.toFixed(1)} dias` : 'N/A'}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div className="flex items-center gap-1 text-violet-600 bg-violet-50 px-2 py-1 rounded-lg text-[10px] font-bold">
              <ArrowUpRight size={12} />
              24
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Leads</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {advancedStats?.total_leads || 0}
          </h3>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={20} />
                Evolução de Receita
              </h3>
              <p className="text-xs text-slate-500 font-medium">Faturamento mensal consolidado.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueMonthly}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                  tickFormatter={(value) => `R$ ${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Origin Pie Chart */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            <Users className="text-indigo-500" size={20} />
            Origem dos Leads
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-8">Distribuição por canal de entrada.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadsByOrigin}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {leadsByOrigin.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Array.isArray(leadsByOrigin) && leadsByOrigin.slice(0, 4).map((item: any, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                <span className="text-[10px] font-bold text-slate-600 truncate">{item.name}</span>
                <span className="text-[10px] font-black text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Performance */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            <ShoppingBag className="text-rose-500" size={20} />
            Produtos em Destaque
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-8">Ranking por volume de vendas.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{fontSize: 10, fontWeight: 700, fill: '#475569'}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="revenue" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loss Reasons */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            <AlertCircle className="text-amber-500" size={20} />
            Motivos de Perda
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-8">Por que não estamos fechando?</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lossReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {lossReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seller Ranking Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              Ranking de Conversão
            </h3>
            <p className="text-xs text-slate-500 font-medium">Performance individual da equipe de vendas.</p>
          </div>
          <button className="text-xs font-bold text-indigo-600 hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendedor</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Oportunidades</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ganhos</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Conversão</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellerConversion.map((seller: any, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {seller.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{seller.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-600">{seller.total}</td>
                  <td className="px-8 py-4 text-sm font-bold text-emerald-600">{seller.won}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[100px]">
                        <div 
                          className="h-full bg-indigo-600 rounded-full" 
                          style={{width: `${seller.rate}%`}}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-900">{seller.rate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      seller.rate > 20 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {seller.rate > 20 ? 'Alta Performance' : 'Em Desenvolvimento'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
