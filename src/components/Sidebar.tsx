import { LayoutDashboard, Kanban, Users, Target, Settings, LogOut, ChevronRight, CheckSquare, Package, BarChart3, Mail, Zap, MessageSquare, Star, FileText, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentPage: 'dashboard' | 'pipeline' | 'leads' | 'goals' | 'tasks' | 'products' | 'reports' | 'settings' | 'email' | 'workflows' | 'communication' | 'scoring' | 'documents' | 'ai';
  onPageChange: (page: any) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onPageChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: Kanban },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'email', label: 'E-mail Marketing', icon: Mail },
    { id: 'workflows', label: 'Workflows', icon: Zap },
    { id: 'communication', label: 'WhatsApp / Canais', icon: MessageSquare },
    { id: 'scoring', label: 'Lead Scoring', icon: Star },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'ai', label: 'Insights IA', icon: Sparkles },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['admin'] },
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const filteredMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <LayoutDashboard size={20} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">CRM</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id as any)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
              currentPage === item.id
                ? "bg-indigo-600 text-white"
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} />
              {item.label}
            </div>
            {currentPage === item.id && <ChevronRight size={14} />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
