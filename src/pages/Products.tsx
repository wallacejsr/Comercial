import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Tag, DollarSign, MoreVertical, Edit2, Trash2, X, Briefcase, Info, ChevronRight, TrendingUp, ShoppingBag, Layers } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  nome: string;
  descricao: string;
  preco_unitario: number;
  categoria: 'Produto' | 'Serviço';
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      preco_unitario: parseFloat(formData.get('preco_unitario') as string),
      categoria: formData.get('categoria'),
    };

    try {
      const url = isEditing && selectedProduct ? `/api/products/${selectedProduct.id}` : '/api/products';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!');
        setIsDrawerOpen(false);
        fetchProducts();
      } else {
        toast.error('Erro ao salvar produto');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        toast.success('Produto excluído');
        fetchProducts();
        if (selectedProduct?.id === id) setIsDrawerOpen(false);
      } else {
        toast.error('Erro ao excluir produto');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    }
  };

  const filteredProducts = products.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) || 
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total de Itens', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Produtos', value: products.filter(p => p.categoria === 'Produto').length, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Serviços', value: products.filter(p => p.categoria === 'Serviço').length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Ticket Médio', value: formatCurrency(products.reduce((acc, p) => acc + p.preco_unitario, 0) / (products.length || 1)), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Produtos</h1>
          <p className="text-slate-500">Gerencie os itens e serviços que sua empresa oferece.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedProduct(null);
            setIsEditing(false);
            setIsDrawerOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Plus size={16} />
          Novo Produto
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou categoria..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Produto / Serviço</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço Unitário</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-slate-500 text-sm">Carregando catálogo...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                    <Package className="mx-auto mb-4 opacity-20" size={48} />
                    <p className="text-lg font-bold text-slate-900 mb-1">Nenhum item encontrado</p>
                    <p className="text-sm">Tente ajustar sua busca ou adicione um novo produto.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsEditing(false);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          product.categoria === 'Produto' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {product.categoria === 'Produto' ? <ShoppingBag size={20} /> : <Briefcase size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{product.nome}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-xs">{product.descricao}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        product.categoria === 'Produto' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      )}>
                        {product.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(product.preco_unitario)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setIsEditing(true);
                            setIsDrawerOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Drawer */}
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
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                    isEditing || !selectedProduct ? "bg-indigo-600 text-white shadow-indigo-100" : "bg-slate-100 text-slate-600 shadow-slate-100"
                  )}>
                    {isEditing || !selectedProduct ? <Plus size={24} /> : <Package size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {isEditing ? 'Editar Produto' : !selectedProduct ? 'Novo Produto' : 'Detalhes do Produto'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {isEditing ? 'Atualize as informações do item.' : !selectedProduct ? 'Cadastre um novo item no catálogo.' : 'Informações completas do item.'}
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

              {isEditing || !selectedProduct ? (
                <form onSubmit={handleSaveProduct} className="p-6 space-y-6 flex-1">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Produto / Serviço *</label>
                      <input 
                        name="nome" 
                        defaultValue={selectedProduct?.nome}
                        required 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                        placeholder="Ex: Consultoria Estratégica" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria *</label>
                        <select 
                          name="categoria" 
                          defaultValue={selectedProduct?.categoria || 'Produto'}
                          required 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        >
                          <option value="Produto">Produto</option>
                          <option value="Serviço">Serviço</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preço Unitário *</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            name="preco_unitario" 
                            type="number" 
                            step="0.01"
                            defaultValue={selectedProduct?.preco_unitario}
                            required 
                            className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição</label>
                      <textarea 
                        name="descricao" 
                        defaultValue={selectedProduct?.descricao}
                        rows={5} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all" 
                        placeholder="Descreva as características do item..."
                      />
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
                      className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-8 flex-1">
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          selectedProduct.categoria === 'Produto' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                        )}>
                          {selectedProduct.categoria}
                        </span>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(selectedProduct.preco_unitario)}</p>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedProduct.nome}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{selectedProduct.descricao || 'Sem descrição informada.'}</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Info size={14} />
                        Informações Adicionais
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                              <Layers size={16} />
                            </div>
                            <span className="text-sm text-slate-600">ID do Produto</span>
                          </div>
                          <span className="text-sm font-mono font-bold text-slate-900">#{selectedProduct.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3 mt-auto">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Editar Produto
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                      className="p-3 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all"
                      title="Excluir Produto"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
        }
      </AnimatePresence>
    </div>
  );
}
