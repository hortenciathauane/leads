import React from 'react';
import { store } from '../../services/store';
import {
  TrendingUp,
  DollarSign,
  Award,
  CheckCircle2,
  XCircle,
  BarChart,
  Calendar,
} from 'lucide-react';

export const SellerResults: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const myLeads = store.getLeads();

  const wonLeads = myLeads.filter((l) => l.etapaFunil === 'venda_concluida');
  const lostLeads = myLeads.filter((l) => l.etapaFunil === 'venda_perdida');
  const inPipelineLeads = myLeads.filter(
    (l) => l.etapaFunil !== 'venda_concluida' && l.etapaFunil !== 'venda_perdida'
  );

  const totalWonValue = wonLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
  const totalPipelineValue = inPipelineLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
  const averageTicket = wonLeads.length > 0 ? totalWonValue / wonLeads.length : 0;
  const conversionRate = myLeads.length > 0 ? ((wonLeads.length / myLeads.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meus Resultados e Produtividade</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Acompanhamento do seu desempenho individual, faturamento acumulado e metas comerciais.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Vendas Concluídas</span>
          <p className="text-3xl font-black text-emerald-600 mt-1">{wonLeads.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">Contratos fechados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Faturamento Pessoal</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            R$ {totalWonValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">Receita gerada</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Ticket Médio</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Por venda fechada</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Taxa de Conversão</span>
          <p className="text-3xl font-black text-indigo-600 mt-1">{conversionRate}%</p>
          <span className="text-xs text-slate-500 mt-1 block">Da sua carteira</span>
        </div>
      </div>

      {/* Lista de Vendas Realizadas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Histórico de Negócios Concluídos
        </h2>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Empresa Conquistada</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">CNAE</th>
                <th className="px-4 py-3 text-right">Valor do Negócio</th>
                <th className="px-4 py-3 text-right">Data de Fechamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wonLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Você ainda não possui vendas concluídas nesta carteira. Continue os follow-ups!
                  </td>
                </tr>
              ) : (
                wonLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{lead.razaoSocial}</span>
                      <span className="text-[11px] font-mono text-slate-400">{lead.cnpj}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.municipio}/{lead.uf}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {lead.cnaePrincipal.descricao}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
