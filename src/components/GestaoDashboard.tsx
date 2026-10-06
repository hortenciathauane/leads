import React, { useState, useMemo } from 'react';
import { store } from '../services/store';
import { FUNNEL_STAGES, FunnelStage } from '../types';
import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface GestaoDashboardProps {
  onNavigateToLeads: () => void;
  onNavigateToFunnel: () => void;
  onNavigateToDistribution: () => void;
}

export const GestaoDashboard: React.FC<GestaoDashboardProps> = ({
  onNavigateToLeads,
  onNavigateToFunnel,
  onNavigateToDistribution,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'todos' | '7dias' | '30dias' | 'ano'>('todos');
  const [vendedorFilter, setVendedorFilter] = useState<string>('');
  const [cnaeFilter, setCnaeFilter] = useState<string>('');
  const [ufFilter, setUfFilter] = useState<string>('');
  const [etapaFilter, setEtapaFilter] = useState<string>('');

  const allLeads = store.getLeads();
  const sellers = store.getSellers();

  // Filtragem dos leads conforme filtros selecionados
  const filteredLeads = useMemo(() => {
    const now = new Date().getTime();
    return allLeads.filter((l) => {
      // Período
      if (periodFilter === '7dias') {
        const leadTime = new Date(l.createdAt).getTime();
        if (now - leadTime > 7 * 24 * 3600 * 1000) return false;
      } else if (periodFilter === '30dias') {
        const leadTime = new Date(l.createdAt).getTime();
        if (now - leadTime > 30 * 24 * 3600 * 1000) return false;
      }

      // Vendedor
      if (vendedorFilter) {
        if (vendedorFilter === 'sem_vendedor' && l.vendedorId) return false;
        if (vendedorFilter !== 'sem_vendedor' && l.vendedorId !== vendedorFilter) return false;
      }

      // CNAE
      if (cnaeFilter && !l.cnaePrincipal.codigo.toLowerCase().includes(cnaeFilter.toLowerCase()) && !l.cnaePrincipal.descricao.toLowerCase().includes(cnaeFilter.toLowerCase())) {
        return false;
      }

      // UF
      if (ufFilter && l.uf.toUpperCase() !== ufFilter.toUpperCase()) {
        return false;
      }

      // Etapa
      if (etapaFilter && l.etapaFunil !== etapaFilter) {
        return false;
      }

      return true;
    });
  }, [allLeads, periodFilter, vendedorFilter, cnaeFilter, ufFilter, etapaFilter]);

  // Indicadores
  const totalLeads = filteredLeads.length;
  const availableLeads = filteredLeads.filter((l) => !l.vendedorId).length;
  const distributedLeads = filteredLeads.filter((l) => !!l.vendedorId).length;
  const inAttendanceLeads = filteredLeads.filter((l) => l.vendedorId && l.etapaFunil !== 'venda_concluida' && l.etapaFunil !== 'venda_perdida').length;
  const wonLeads = filteredLeads.filter((l) => l.etapaFunil === 'venda_concluida');
  const wonCount = wonLeads.length;
  const wonValueTotal = wonLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
  const totalValueInPipeline = filteredLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);

  const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : '0.0';

  // Leads atrasados e sem contato
  const todayStr = new Date().toDateString();
  const overdueLeads = filteredLeads.filter(
    (l) => l.dataRetorno && new Date(l.dataRetorno) < new Date(todayStr) && l.etapaFunil !== 'venda_concluida' && l.etapaFunil !== 'venda_perdida'
  );

  const staleLeads = filteredLeads.filter((l) => {
    if (l.etapaFunil === 'venda_concluida' || l.etapaFunil === 'venda_perdida') return false;
    const diffDays = (new Date().getTime() - new Date(l.updatedAt).getTime()) / (1000 * 3600 * 24);
    return diffDays > 7;
  });

  // Desempenho por vendedor
  const sellerPerformance = sellers.map((seller) => {
    const sLeads = allLeads.filter((l) => l.vendedorId === seller.id);
    const sWon = sLeads.filter((l) => l.etapaFunil === 'venda_concluida');
    const sWonValue = sWon.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
    const sConversion = sLeads.length > 0 ? ((sWon.length / sLeads.length) * 100).toFixed(1) : '0.0';
    const sOverdue = sLeads.filter((l) => l.dataRetorno && new Date(l.dataRetorno) < new Date(todayStr)).length;

    return {
      seller,
      totalLeads: sLeads.length,
      wonCount: sWon.length,
      wonValue: sWonValue,
      conversionRate: sConversion,
      overdueCount: sOverdue,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel da Gestão Comercial</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Visão consolidada de indicadores de vendas, distribuição de carteiras e acompanhamento da equipe.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToDistribution}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            Distribuir Leads ({availableLeads} disp.)
          </button>
        </div>
      </div>

      {/* Barra de Filtros do Dashboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-2">
          <Filter className="w-4 h-4 text-blue-600" />
          Filtros Gerais:
        </div>

        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todo o Período</option>
          <option value="7dias">Últimos 7 dias</option>
          <option value="30dias">Últimos 30 dias</option>
        </select>

        <select
          value={vendedorFilter}
          onChange={(e) => setVendedorFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os Vendedores</option>
          <option value="sem_vendedor">Apenas não distribuídos</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={ufFilter}
          onChange={(e) => setUfFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os Estados (UF)</option>
          <option value="SP">São Paulo (SP)</option>
          <option value="MG">Minas Gerais (MG)</option>
          <option value="RJ">Rio de Janeiro (RJ)</option>
          <option value="SC">Santa Catarina (SC)</option>
        </select>

        <select
          value={etapaFilter}
          onChange={(e) => setEtapaFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as Etapas</option>
          {FUNNEL_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {(periodFilter !== 'todos' || vendedorFilter || ufFilter || etapaFilter) && (
          <button
            onClick={() => {
              setPeriodFilter('todos');
              setVendedorFilter('');
              setUfFilter('');
              setEtapaFilter('');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold ml-auto cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Leads</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{totalLeads}</span>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-semibold text-blue-600">{availableLeads} disponíveis</span>
              <span>•</span>
              <span>{inAttendanceLeads} em atendimento</span>
            </div>
          </div>
        </div>

        {/* Vendas Concluídas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendas Realizadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">{wonCount}</span>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-700">Taxa de Conversão: {conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Valor Negociado */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento Concluído</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              R$ {wonValueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className="text-[11px] text-slate-500 mt-1">
              Pipeline total: R$ {totalValueInPipeline.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Alertas de Retorno Atrasado */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atenção Comercial</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">{overdueLeads.length}</span>
              <span className="text-xs text-rose-600 font-bold">retornos atrasados</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              {staleLeads.length} leads sem contato há mais de 7 dias
            </div>
          </div>
        </div>
      </div>

      {/* Visual Funnel Representation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Distribuição dos Leads no Funil Comercial
          </h2>
          <button
            onClick={onNavigateToFunnel}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Abrir Funil Completo <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 pt-2">
          {FUNNEL_STAGES.map((s) => {
            const count = filteredLeads.filter((l) => l.etapaFunil === s.id).length;
            const pct = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : '0';

            return (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-colors flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block truncate">{s.label}</span>
                  <div className="text-xl font-black text-slate-900 mt-1">{count}</div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.id === 'venda_concluida' ? 'bg-emerald-500' : s.id === 'venda_perdida' ? 'bg-rose-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.max(Number(pct), 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desempenho da Equipe e Alertas Operacionais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Desempenho dos Vendedores */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Desempenho Individual da Equipe Comercial
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-3 py-3 text-center">Leads na Carteira</th>
                  <th className="px-3 py-3 text-center">Vendas Fechadas</th>
                  <th className="px-3 py-3 text-center">Conversão</th>
                  <th className="px-4 py-3 text-right">Valor Faturado</th>
                  <th className="px-3 py-3 text-center">Atrasados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellerPerformance.map(({ seller, totalLeads, wonCount, wonValue, conversionRate, overdueCount }) => (
                  <tr key={seller.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {seller.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{seller.email}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{totalLeads}</td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-600">{wonCount}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">{conversionRate}%</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      R$ {wonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {overdueCount} atrasado(s)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas Operacionais Imediatos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Alertas de Retorno Imediato
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Leads com data de contato agendada expirada que exigem ação da gestão ou vendedor.
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {overdueLeads.length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-emerald-900">Nenhum retorno atrasado</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Todos os contatos agendados estão em dia.</p>
                </div>
              ) : (
                overdueLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    onClick={onNavigateToLeads}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-[170px]">{lead.razaoSocial}</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        Venceu {lead.dataRetorno}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Vendedor: <strong className="text-slate-800">{lead.vendedorNome || 'Não atribuído'}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToLeads}
            className="w-full mt-4 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
          >
            Ver Todos os Leads em Alerta
          </button>
        </div>
      </div>
    </div>
  );
};
