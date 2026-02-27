/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Leads from './pages/Leads';
import Goals from './pages/Goals';
import Tasks from './pages/Tasks';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import EmailMarketing from './pages/EmailMarketing';
import Workflows from './pages/Workflows';
import Communication from './pages/Communication';
import LeadScoring from './pages/LeadScoring';
import Documents from './pages/Documents';
import AIInsights from './pages/AIInsights';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { user, login, logout, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'pipeline' | 'leads' | 'goals' | 'tasks' | 'products' | 'reports' | 'settings' | 'email' | 'workflows' | 'communication' | 'scoring' | 'documents' | 'ai'>('dashboard');

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user) {
    return <Login onLogin={login} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'pipeline': return <Pipeline />;
      case 'leads': return <Leads />;
      case 'goals': return <Goals />;
      case 'tasks': return <Tasks />;
      case 'products': return <Products />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      case 'email': return <EmailMarketing />;
      case 'workflows': return <Workflows />;
      case 'communication': return <Communication />;
      case 'scoring': return <LeadScoring />;
      case 'documents': return <Documents />;
      case 'ai': return <AIInsights />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
