import React, { useState, useMemo } from 'react';
import { store } from '../services/store';
import { Lead, User } from '../types';
import {
  Users,
  Send,
  CheckSquare,
  Square,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';

export const LeadDistribution: React.FC = () => {
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [targetSellerId, setTargetSellerId] = useState<string>('');
  const [distributionMode, setDistributionMode] = useState<'individual' | 'equilibrada' | 'reatribuir_carteira'>('equilibrada');

  // Multi-seller selection for balanced round-robin
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);

  // Filters for available leads
  const [filterMode, setFilterMode] = useState<'apenas_disponiveis' | 'todos'>('apenas_disponiveis');
  const [filterCnae, setFilterCnae] = useState('');
  const [filterUf, setFilterUf] = useState('');
  const [filterCidade, setFilterCidade] = useState('');

  // Reatribuir carteira
  const [fromSellerId, setFromSellerId] = useState('');
  const [toSellerId, setToSellerId] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const allLeads = store.getLeads();
  const sellers = store.getSellers().filter((s) => s.active);

  // Contadores
  const availableCount = allLeads.filter((l) => !l.vendedorId).length;
  const assignedCount = allLeads.filter((l) => !!l.vendedorId).length;

  const leadsForDistribution = useMemo(() => {
    return allLeads.filter((lead) => {
      if (filterMode === 'apenas_disponiveis' && lead.vendedorId) return false;
      if (filterCnae) {
        const cnaeMatch =
          lead.cnaePrincipal.codigo.toLowerCase().includes(filterCnae.toLowerCase()) ||
          lead.cnaePrincipal.descricao.toLowerCase().includes(filterCnae.toLowerCase());
        if (!cnaeMatch) return false;
      }
      if (filterUf && lead.uf.toUpperCase() !== filterUf.toUpperCase()) return false;
      if (filterCidade && !lead.municipio.toLowerCase().includes(filterCidade.toLowerCase())) return false;
      return true;
    });
  }, [allLeads, filterMode, filterCnae, filterUf, filterCidade]);

  const handleSelectAll = () => {
    if (selectedLeadIds.length === leadsForDistribution.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leadsForDistribution.map((l) => l.id));
    }
  };

  const toggleLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const toggleSellerSelect = (sellerId: string) => {
    if (selectedSellerIds.includes(sellerId)) {
      setSelectedSellerIds(selectedSellerIds.filter((id) => id !== sellerId));
    } else {
      setSelectedSellerIds([...selectedSellerIds, sellerId]);
    }
  };

  const handleExecuteDistribution = () => {
    setFeedback(null);
    if (selectedLeadIds.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos um lead para distribuir.' });
      return;
    }

    if (distributionMode === 'individual') {
      if (!targetSellerId) {
        setFeedback({ type: 'error', message: 'Selecione o vendedor de destino.' });
        return;
      }
      const res = store.distributeLeads(selectedLeadIds, targetSellerId, 'manual');
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${selectedLeadIds.length} lead(s) distribuído(s) com sucesso para o vendedor!`,
        });
        setSelectedLeadIds([]);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro na distribuição.' });
      }
    } else if (distributionMode === 'equilibrada') {
      if (selectedSellerIds.length === 0) {
        setFeedback({
          type: 'error',
          message: 'Selecione pelo menos um vendedor participante para a distribuição equilibrada.',
        });
        return;
      }
      const res = store.distributeEqually(selectedLeadIds, selectedSellerIds);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Distribuição equilibrada de ${selectedLeadIds.length} leads realizada entre os ${selectedSellerIds.length} vendedores selecionados!`,
        });
        setSelectedLeadIds([]);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro na distribuição.' });
      }
    }
  };

  const handleTransferPortfolio = () => {
    setFeedback(null);
    if (!fromSellerId || !toSellerId) {
      setFeedback({ type: 'error', message: 'Selecione o vendedor de origem e o vendedor de destino.' });
      return;
    }
    if (fromSellerId === toSellerId) {
      setFeedback({ type: 'error', message: 'O vendedor de origem e destino não podem ser o mesmo.' });
      return;
    }

    const res = store.reassignAllLeads(fromSellerId, toSellerId);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Carteira transferida com sucesso! ${res.count} leads foram reatribuídos e registrados no histórico de auditoria.`,
      });
      setFromSellerId('');
      setToSellerId('');
    } else {
      setFeedback({ type: 'error', message: res.message || 'Erro na transferência.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Distribuição e Dimensionamento de Leads</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Área exclusiva da gestão para atribuição manual, distribuição equilibrada (round-robin) e transferência de carteiras entre vendedores.
        </p>
      </div>

      {/* Cards de Dimensionamento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads Disponíveis</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600">{availableCount}</span>
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-semibold border border-amber-200">
              Aguardando atribuição
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads Atribuídos</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-blue-600">{assignedCount}</span>
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-200">
              Em atendimento
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendedores Ativos</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{sellers.length}</span>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-semibold">
              Equipe comercial
            </span>
          </div>
        </div>
      </div>

      {/* Dimensionamento por Vendedor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Dimensionamento da Equipe (Leads Ativos por Vendedor)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {sellers.map((s) => {
            const count = allLeads.filter((l) => l.vendedorId === s.id).length;
            const closed = allLeads.filter((l) => l.vendedorId === s.id && l.etapaFunil === 'venda_concluida').length;

            return (
              <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs truncate">{s.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {count} leads
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {closed} vendas concluídas
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Abas de Modo de Distribuição */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex border-b border-slate-200 pb-3 gap-2">
          <button
            onClick={() => setDistributionMode('equilibrada')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              distributionMode === 'equilibrada'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Distribuição Equilibrada (Round-Robin)
          </button>
          <button
            onClick={() => setDistributionMode('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              distributionMode === 'individual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Atribuição Direta para Vendedor
          </button>
          <button
            onClick={() => setDistributionMode('reatribuir_carteira')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              distributionMode === 'reatribuir_carteira'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Transferência de Carteira Completa
          </button>
        </div>

        {/* MODOS DE SELEÇÃO DE LEADS */}
        {distributionMode !== 'reatribuir_carteira' ? (
          <div className="space-y-6">
            {/* Configuração dos Destinatários */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              {distributionMode === 'equilibrada' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Selecione os vendedores para divisão equilibrada dos leads:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sellers.map((s) => {
                      const isSel = selectedSellerIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSellerSelect(s.id)}
                          className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                            isSel
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSel ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="max-w-md">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Vendedor Destinatário:
                  </label>
                  <select
                    value={targetSellerId}
                    onChange={(e) => setTargetSellerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
                  >
                    <option value="">Selecione o vendedor...</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Filtros da lista de leads para distribuir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status de Atribuição</label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="apenas_disponiveis">Apenas Disponíveis (Não atribuídos)</option>
                  <option value="todos">Todos (Permite Reatribuição)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">CNAE Principal</label>
                <input
                  type="text"
                  placeholder="Ex: 4753"
                  value={filterCnae}
                  onChange={(e) => setFilterCnae(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="Ex: SP"
                  value={filterUf}
                  onChange={(e) => setFilterUf(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={filterCidade}
                  onChange={(e) => setFilterCidade(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Ações em Massa */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedLeadIds.length === leadsForDistribution.length && leadsForDistribution.length > 0 ? (
                    <>
                      <CheckSquare className="w-4 h-4" /> Desmarcar Todos
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" /> Selecionar Todos ({leadsForDistribution.length})
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-500">
                  <strong>{selectedLeadIds.length}</strong> lead(s) selecionado(s)
                </span>
              </div>

              <button
                type="button"
                onClick={handleExecuteDistribution}
                disabled={selectedLeadIds.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
                Distribuir Leads Selecionados
              </button>
            </div>

            {/* Tabela de Leads Disponíveis */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-10 text-center">Sel.</th>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">CNAE</th>
                      <th className="px-4 py-3">Localização</th>
                      <th className="px-4 py-3">Responsável Atual</th>
                      <th className="px-4 py-3 text-right">Valor Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leadsForDistribution.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <p className="text-sm font-bold text-slate-700">Nenhum lead aguardando distribuição</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                            Utilize o menu <strong>Prospecção</strong> (Consulta CNPJ ou Prospecção por Raio de Distância) para incluir novas empresas na base e dimensioná-las aos vendedores.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      leadsForDistribution.map((lead) => {
                        const isSelected = selectedLeadIds.includes(lead.id);

                        return (
                          <tr
                            key={lead.id}
                            onClick={() => toggleLead(lead.id)}
                            className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/60' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 mx-auto" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {lead.razaoSocial}
                              <span className="block text-[11px] font-mono text-slate-400 font-normal">
                                {lead.cnpj}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                              [{lead.cnaePrincipal.codigo}] {lead.cnaePrincipal.descricao}
                            </td>
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                              {lead.municipio}/{lead.uf}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {lead.vendedorNome ? (
                                <span className="font-semibold text-slate-800">{lead.vendedorNome}</span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                                  Disponível
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* TRANSFERÊNCIA COMPLETA DE CARTEIRA */
          <div className="max-w-xl space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong className="block text-sm mb-1 flex items-center gap-1.5 text-amber-950 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Transferência de Carteira em Massa
              </strong>
              Utilize esta opção em caso de férias, afastamento médico ou desligamento de um vendedor. Todos os leads
              atribuídos ao vendedor de origem serão transferidos para o vendedor de destino, com registro completo no
              histórico de auditoria do sistema.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendedor de Origem (Afastado/Desligado):
                </label>
                <select
                  value={fromSellerId}
                  onChange={(e) => setFromSellerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">Selecione o vendedor...</option>
                  {store.getSellers().map((s) => {
                    const count = allLeads.filter((l) => l.vendedorId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({count} leads)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Vendedor Responsável (Destino):
                </label>
                <select
                  value={toSellerId}
                  onChange={(e) => setToSellerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">Selecione o vendedor...</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTransferPortfolio}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/20"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transferir Carteira Completa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
