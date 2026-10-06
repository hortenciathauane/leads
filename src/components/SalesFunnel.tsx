import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { FUNNEL_STAGES, FunnelStage, Lead } from '../types';
import { store } from '../services/store';
import { LeadDetailModal } from './LeadDetailModal';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  X,
  User as UserIcon,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

interface SalesFunnelProps {
  isSellerView?: boolean;
}

export const SalesFunnel: React.FC<SalesFunnelProps> = ({ isSellerView = false }) => {
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Modal para motivo de perda ao mover para 'venda_perdida'
  const [lossModalLead, setLossModalLead] = useState<Lead | null>(null);
  const [lossReasonInput, setLossReasonInput] = useState('');
  const [lossFeedback, setLossFeedback] = useState<{
    type: 'success' | 'pendency';
    message: string;
  } | null>(null);

  const leads = store.getLeads();
  const sellers = store.getSellers();

  const filteredLeads = leads.filter((lead) => {
    if (!isSellerView && selectedSellerFilter) {
      if (selectedSellerFilter === 'sem_vendedor' && lead.vendedorId) return false;
      if (selectedSellerFilter !== 'sem_vendedor' && lead.vendedorId !== selectedSellerFilter) return false;
    }
    return true;
  });

  const handleMoveStage = (lead: Lead, newStage: FunnelStage) => {
    if (newStage === 'venda_perdida') {
      setLossModalLead(lead);
      setLossReasonInput('');
      return;
    }

    if (newStage === 'venda_concluida') {
      // Dispara confetti de comemoração
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }

    store.updateLeadStage(lead.id, newStage);
  };

  const handleConfirmLoss = (e: React.FormEvent) => {
    e.preventDefault();
    setLossFeedback(null);

    if (!lossModalLead) return;

    if (!lossReasonInput.trim()) {
      setLossFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: Informe o motivo da perda da venda para prosseguir.',
      });
      return;
    }

    const res = store.updateLeadStage(lossModalLead.id, 'venda_perdida', {
      motivoPerda: lossReasonInput.trim(),
    });

    if (res.success) {
      setLossFeedback({
        type: 'success',
        message: 'Venda perdida registrada e salva com sucesso no banco de dados!',
      });
      setTimeout(() => {
        setLossModalLead(null);
        setLossReasonInput('');
        setLossFeedback(null);
      }, 1000);
    } else {
      setLossFeedback({
        type: 'pendency',
        message: res.message || 'Erro ao registrar perda.',
      });
    }
  };

  // Helper para verificar se retorno está atrasado
  const checkIsOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
  };

  // Helper para verificar sem atividade recente (> 7 dias)
  const checkIsStale = (updatedAt: string) => {
    const diffDays = (new Date().getTime() - new Date(updatedAt).getTime()) / (1000 * 3600 * 24);
    return diffDays > 7;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSellerView ? 'Meu Funil de Vendas' : 'Funil de Vendas'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Acompanhe visualmente a evolução das oportunidades comerciais através das 9 etapas do funil de vendas.
          </p>
        </div>

        {!isSellerView && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Filtrar por Vendedor:</span>
            <select
              value={selectedSellerFilter}
              onChange={(e) => setSelectedSellerFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Vendedores</option>
              <option value="sem_vendedor">Leads sem vendedor</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban Board Container (Scroll horizontal para as 9 colunas) */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {FUNNEL_STAGES.map((stage, colIndex) => {
          const stageLeads = filteredLeads.filter((l) => l.etapaFunil === stage.id);
          const stageTotalValue = stageLeads.reduce((acc, curr) => acc + (curr.valorOportunidade || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-80 shrink-0 flex flex-col bg-slate-100/90 rounded-2xl border border-slate-200/80 max-h-[78vh] shadow-xs"
            >
              {/* Coluna Header */}
              <div className="p-3.5 border-b border-slate-200/80 bg-white/70 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {stage.label}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] flex items-center justify-center font-bold">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-slate-500">
                  R$ {stageTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Lista de Cards da Etapa */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-300/80 rounded-xl">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const isOverdue = checkIsOverdue(lead.dataRetorno);
                    const isStale = checkIsStale(lead.updatedAt);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                      >
                        {/* Alertas visuais de retorno atrasado e sem atividade */}
                        {(isOverdue || isStale) && (
                          <div className="flex flex-wrap gap-1">
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-2.5 h-2.5" /> Retorno Atrasado
                              </span>
                            )}
                            {isStale && !isOverdue && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-2.5 h-2.5" /> Sem atividade recente
                              </span>
                            )}
                          </div>
                        )}

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {lead.razaoSocial}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.cnpj}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-900">
                            R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {lead.municipio}/{lead.uf}
                          </span>
                        </div>

                        {!isSellerView && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{lead.vendedorNome || 'Não distribuído'}</span>
                          </div>
                        )}

                        {lead.dataRetorno && (
                          <div
                            className={`text-[11px] flex items-center gap-1 ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            Retorno:{' '}
                            {new Date(lead.dataRetorno + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        )}

                        {lead.motivoPerda && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                            <strong>Motivo da perda:</strong> {lead.motivoPerda}
                          </div>
                        )}

                        {/* Botões rápidos para avançar/voltar etapa */}
                        <div
                          className="flex items-center justify-between pt-2 border-t border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={colIndex === 0}
                            onClick={() => handleMoveStage(lead, FUNNEL_STAGES[colIndex - 1].id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                            title="Voltar etapa"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[10px] font-semibold text-slate-400">
                            Etapa {colIndex + 1}/9
                          </span>

                          <button
                            type="button"
                            disabled={colIndex === FUNNEL_STAGES.length - 1}
                            onClick={() => handleMoveStage(lead, FUNNEL_STAGES[colIndex + 1].id)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 cursor-pointer"
                            title="Avançar etapa"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Obrigatório: Motivo da Perda */}
      {lossModalLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Registrar Venda Perdida
              </h3>
              <button
                onClick={() => setLossModalLead(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Para fins de auditoria e relatórios gerenciais da empresa{' '}
              <strong className="text-slate-800">{lossModalLead.razaoSocial}</strong>, informe o motivo pelo qual a negociação foi perdida.
            </p>

            {/* Sinalização de Sucesso ou Pendência */}
            {lossFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                  lossFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border-amber-200'
                }`}
              >
                {lossFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold block">
                    {lossFeedback.type === 'success' ? 'Sucesso!' : 'Atenção: Pendência para prosseguir'}
                  </span>
                  <span>{lossFeedback.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmLoss} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Perda (Obrigatório) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={lossReasonInput}
                  onChange={(e) => setLossReasonInput(e.target.value)}
                  placeholder="Ex: Optou pelo concorrente X devido a prazo estendido; Falta de orçamento neste semestre; Desistência do projeto..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLossModalLead(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Confirmar Venda Perdida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Lead ao clicar */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => {
            const updated = store.getLeadById(selectedLead.id);
            if (updated) setSelectedLead(updated);
          }}
        />
      )}
    </div>
  );
};
