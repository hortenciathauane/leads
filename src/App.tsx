import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { User } from './types';
import { Login } from './components/Login';
import { GestaoDashboard } from './components/GestaoDashboard';
import { Prospecting } from './components/Prospecting';
import { LeadsList } from './components/LeadsList';
import { LeadDistribution } from './components/LeadDistribution';
import { SalesFunnel } from './components/SalesFunnel';
import { SellerManagement } from './components/SellerManagement';
import { Reports } from './components/Reports';
import { AuditHistory } from './components/AuditHistory';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { SellerActivities } from './components/seller/SellerActivities';
import { SellerResults } from './components/seller/SellerResults';
import {
  LayoutDashboard,
  Search,
  Building2,
  Users,
  Filter,
  FileText,
  History,
  TrendingUp,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  Award,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Define default tab when user changes
  useEffect(() => {
    if (!currentUser) {
      setActiveTab('');
    } else if (currentUser.role === 'gestao') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('meu_dashboard');
    }
  }, [currentUser?.role, currentUser?.id]);

  if (!currentUser) {
    return <Login onLoginSuccess={() => setCurrentUser(store.getCurrentUser())} />;
  }

  const isGestao = currentUser.role === 'gestao';

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Gestão de Vendas</h1>
            <p className="text-[10px] text-slate-400 capitalize">
              {isGestao ? 'Painel da Gestão' : 'Painel do Vendedor'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/80 hidden lg:flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white leading-tight">Gestão de Vendas</h2>
              <span className="text-[11px] font-semibold text-blue-400">
                {isGestao ? 'Perfil Gestão' : 'Perfil Vendedor'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto">
            {isGestao ? (
              /* MENU DA GESTÃO */
              <>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  onClick={() => {
                    setActiveTab('prospeccao');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'prospeccao'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Prospecção
                </button>

                <button
                  onClick={() => {
                    setActiveTab('leads');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'leads'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Leads
                </button>

                <button
                  onClick={() => {
                    setActiveTab('distribuicao');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'distribuicao'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Distribuição
                </button>

                <button
                  onClick={() => {
                    setActiveTab('funil');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'funil'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Funil de vendas
                </button>

                <button
                  onClick={() => {
                    setActiveTab('vendedores');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'vendedores'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Vendedores
                </button>

                <button
                  onClick={() => {
                    setActiveTab('relatorios');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'relatorios'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Relatórios
                </button>

                <button
                  onClick={() => {
                    setActiveTab('historico');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'historico'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Histórico
                </button>
              </>
            ) : (
              /* MENU DO VENDEDOR */
              <>
                <button
                  onClick={() => {
                    setActiveTab('meu_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'meu_dashboard'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Meu dashboard
                </button>

                <button
                  onClick={() => {
                    setActiveTab('meus_leads');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'meus_leads'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Meus leads
                </button>

                <button
                  onClick={() => {
                    setActiveTab('meu_funil');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'meu_funil'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Meu funil de vendas
                </button>

                <button
                  onClick={() => {
                    setActiveTab('atividades');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'atividades'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Atividades e retornos
                </button>

                <button
                  onClick={() => {
                    setActiveTab('meus_resultados');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === 'meus_resultados'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Meus resultados
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-xs">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
              Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Roteamento de telas da GESTÃO */}
        {isGestao && activeTab === 'dashboard' && (
          <GestaoDashboard
            onNavigateToLeads={() => setActiveTab('leads')}
            onNavigateToFunnel={() => setActiveTab('funil')}
            onNavigateToDistribution={() => setActiveTab('distribuicao')}
          />
        )}
        {isGestao && activeTab === 'prospeccao' && <Prospecting />}
        {isGestao && activeTab === 'leads' && <LeadsList />}
        {isGestao && activeTab === 'distribuicao' && <LeadDistribution />}
        {isGestao && activeTab === 'funil' && <SalesFunnel />}
        {isGestao && activeTab === 'vendedores' && <SellerManagement />}
        {isGestao && activeTab === 'relatorios' && <Reports />}
        {isGestao && activeTab === 'historico' && <AuditHistory />}

        {/* Roteamento de telas do VENDEDOR */}
        {!isGestao && activeTab === 'meu_dashboard' && (
          <SellerDashboard
            onNavigateToMyLeads={() => setActiveTab('meus_leads')}
            onNavigateToMyFunnel={() => setActiveTab('meu_funil')}
            onNavigateToActivities={() => setActiveTab('atividades')}
          />
        )}
        {!isGestao && activeTab === 'meus_leads' && <LeadsList isSellerView={true} />}
        {!isGestao && activeTab === 'meu_funil' && <SalesFunnel isSellerView={true} />}
        {!isGestao && activeTab === 'atividades' && <SellerActivities />}
        {!isGestao && activeTab === 'meus_resultados' && <SellerResults />}
      </main>
    </div>
  );
}
