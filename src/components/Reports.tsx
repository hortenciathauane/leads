import React, { useState, useMemo } from 'react';
import { store } from '../services/store';
import { FUNNEL_STAGES } from '../types';
import { exportLeadsToCsv } from '../services/csvUtils';
import {
  FileText,
  Download,
  Filter,
  BarChart,
  PieChart,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [period, setPeriod] = useState<'30' | '90' | '365' | 'todos'>('todos');
  const [vendedorFilter, setVendedorFilter] = useState('');
  const [cnaeFilter, setCnaeFilter] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  const [etapaFilter, setEtapaFilter] = useState('');

  const leads = store.getLeads();
  const sellers = store.getSellers();

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (vendedorFilter && l.vendedorId !== vendedorFilter) return false;
      if (cnaeFilter && !l.cnaePrincipal.codigo.toLowerCase().includes(cnaeFilter.toLowerCase())) return false;
      if (ufFilter && l.uf !== ufFilter) return false;
      if (etapaFilter && l.etapaFunil !== etapaFilter) return false;
      return true;
    });
  }, [leads, vendedorFilter, cnaeFilter, ufFilter, etapaFilter]);

  // Estatísticas calculadas
  const totalLeads = filteredLeads.length;
  const wonLeads = filteredLeads.filter((l) => l.etapaFunil === 'venda_concluida');
  const lostLeads = filteredLeads.filter((l) => l.etapaFunil === 'venda_perdida');
  const totalWonValue = wonLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
  const totalPipelineValue = filteredLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
  const conversionRate = totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : '0';

  // Motivos de perda
  const lossReasonsCount = useMemo(() => {
    const counts: { [reason: string]: number } = {};
    lostLeads.forEach((l) => {
      const reason = l.motivoPerda || 'Motivo não especificado';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [lostLeads]);

  const handleExportCsv = () => {
    exportLeadsToCsv(filteredLeads, 'relatorio_gerencial_vendas.csv');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios Comerciais e Métricas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Análises aprofundadas de produtividade da equipe, taxas de conversão, motivos de perda e exportação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros do Relatório */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Vendedor Responsável</label>
          <select
            value={vendedorFilter}
            onChange={(e) => setVendedorFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">Todos os Vendedores</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Estado (UF)</label>
          <select
            value={ufFilter}
            onChange={(e) => setUfFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">Todos os Estados</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="MG">Minas Gerais (MG)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
            <option value="SC">Santa Catarina (SC)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa do Funil</label>
          <select
            value={etapaFilter}
            onChange={(e) => setEtapaFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">Todas as Etapas</option>
            {FUNNEL_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">CNAE Principal</label>
          <input
            type="text"
            placeholder="Ex: 6201"
            value={cnaeFilter}
            onChange={(e) => setCnaeFilter(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Leads Filtrados</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalLeads}</p>
          <span className="text-xs text-slate-500 mt-1 block">Volume analisado</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Taxa de Conversão</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{conversionRate}%</p>
          <span className="text-xs text-slate-500 mt-1 block">{wonLeads.length} negócios fechados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Faturamento Realizado</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            R$ {totalWonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Receita confirmada</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Pipeline Total</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            R$ {totalPipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Oportunidades mapeadas</span>
        </div>
      </div>

      {/* Análise de Motivos de Perda */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Análise de Motivos de Perda (Loss Reasons)</h2>
        <p className="text-xs text-slate-500">
          Identifique gargalos na proposta de valor e comportamento dos concorrentes no mercado.
        </p>

        {lossReasonsCount.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Nenhuma venda perdida registrada para o filtro atual.
          </div>
        ) : (
          <div className="space-y-3">
            {lossReasonsCount.map(([reason, count]) => {
              const pct = ((count / lostLeads.length) * 100).toFixed(0);

              return (
                <div key={reason} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{reason}</span>
                    <span className="font-semibold text-slate-600">
                      {count} lead(s) ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
