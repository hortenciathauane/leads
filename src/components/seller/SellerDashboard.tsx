import React from 'react';
import { store } from '../../services/store';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface SellerDashboardProps {
  onNavigateToMyLeads: () => void;
  onNavigateToMyFunnel: () => void;
  onNavigateToActivities: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onNavigateToMyLeads,
  onNavigateToMyFunnel,
  onNavigateToActivities,
}) => {
  const currentUser = store.getCurrentUser();
  const myLeads = store.getLeads(); // store.getLeads() automatically restricts to current seller's leads

  const totalReceived = myLeads.length;
  const pendingContact = myLeads.filter(
    (l) => l.etapaFunil === 'lead_recebido' || l.etapaFunil === 'primeiro_contato_pendente'
  ).length;
  const inNegotiation = myLeads.filter(
    (l) => l.etapaFunil === 'em_negociacao' || l.etapaFunil === 'proposta_enviada'
  ).length;
  const wonLeads = myLeads.filter((l) => l.etapaFunil === 'venda_concluida');
  const wonCount = wonLeads.length;
  const wonTotalValue = wonLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
  const lostCount = myLeads.filter((l) => l.etapaFunil === 'venda_perdida').length;

  const conversionRate = totalReceived > 0 ? ((wonCount / totalReceived) * 100).toFixed(1) : '0.0';

  const todayStr = new Date().toDateString();
  const overdueFollowUps = myLeads.filter(
    (l) => l.dataRetorno && new Date(l.dataRetorno) < new Date(todayStr) && l.etapaFunil !== 'venda_concluida' && l.etapaFunil !== 'venda_perdida'
  );

  const upcomingFollowUps = myLeads.filter(
    (l) => l.dataRetorno && new Date(l.dataRetorno) >= new Date(todayStr) && l.etapaFunil !== 'venda_concluida' && l.etapaFunil !== 'venda_perdida'
  );

  return (
    <div className="space-y-6">
      {/* Header Boas-vindas */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Painel do Vendedor</span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Olá, {currentUser?.name}!</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
            Acompanhe o andamento dos seus clientes em prospecção, retornos agendados e feche novas vendas hoje.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToMyFunnel}
            className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-colors"
          >
            Acessar Meu Funil
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads Recebidos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads Recebidos</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalReceived}</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Sua carteira
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {pendingContact} contato(s) pendente(s)
          </div>
        </div>

        {/* Em Negociação */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Em Negociação Ativa</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-600">{inNegotiation}</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Proposta / Negociação
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Oportunidades quentes</div>
        </div>

        {/* Vendas Concluídas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendas Fechadas</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-600">{wonCount}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {conversionRate}% conversão
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {lostCount} oportunidade(s) perdida(s)
          </div>
        </div>

        {/* Valor Total das Vendas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total em Vendas</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              R$ {wonTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Faturamento confirmado
          </div>
        </div>
      </div>

      {/* Retornos e Follow-ups Prioritários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retornos Atrasados */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Retornos Atrasados (Ação Imediata)
            </h2>
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center">
              {overdueFollowUps.length}
            </span>
          </div>

          <div className="space-y-3">
            {overdueFollowUps.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900">Excelente! Nenhum retorno atrasado.</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Sua carteira comercial está 100% em dia.</p>
              </div>
            ) : (
              overdueFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  onClick={onNavigateToMyLeads}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{lead.razaoSocial}</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.cnpj}</p>
                    {lead.proximaAcao && (
                      <p className="text-xs text-rose-700 font-medium mt-1">
                        Ação: {lead.proximaAcao}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md block">
                      Venceu {lead.dataRetorno}
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">
                      R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximas Atividades e Retornos Agendados */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Próximos Contatos Agendados
            </h2>
            <button
              onClick={onNavigateToActivities}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Ver Todas as Atividades
            </button>
          </div>

          <div className="space-y-3">
            {upcomingFollowUps.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Nenhum retorno futuro agendado no momento.
              </div>
            ) : (
              upcomingFollowUps.slice(0, 4).map((lead) => (
                <div
                  key={lead.id}
                  onClick={onNavigateToMyLeads}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{lead.razaoSocial}</h4>
                    <p className="text-[11px] text-slate-500">{lead.municipio}/{lead.uf}</p>
                    {lead.proximaAcao && (
                      <p className="text-xs text-blue-700 font-medium mt-1">
                        {lead.proximaAcao}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md block">
                      {new Date(lead.dataRetorno! + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">
                      R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
