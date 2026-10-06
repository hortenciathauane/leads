import React, { useState, useMemo } from 'react';
import { Lead, FUNNEL_STAGES, FunnelStage } from '../types';
import { store } from '../services/store';
import { exportLeadsToCsv } from '../services/csvUtils';
import { LeadDetailModal } from './LeadDetailModal';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface LeadsListProps {
  isSellerView?: boolean;
}

export const LeadsList: React.FC<LeadsListProps> = ({ isSellerView = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCnae, setFilterCnae] = useState('');
  const [filterUf, setFilterUf] = useState('');
  const [filterCidade, setFilterCidade] = useState('');
  const [filterBairro, setFilterBairro] = useState('');
  const [filterCep, setFilterCep] = useState('');
  const [filterSituacao, setFilterSituacao] = useState('');
  const [filterEtapa, setFilterEtapa] = useState<string>('');
  const [filterVendedor, setFilterVendedor] = useState<string>('');
  const [filterAtrasadosApenas, setFilterAtrasadosApenas] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const leads = store.getLeads();
  const sellers = store.getSellers();

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          lead.razaoSocial.toLowerCase().includes(term) ||
          (lead.nomeFantasia && lead.nomeFantasia.toLowerCase().includes(term)) ||
          lead.cnpj.includes(term) ||
          lead.municipio.toLowerCase().includes(term);
        if (!match) return false;
      }

      // CNAE
      if (filterCnae) {
        const cnaeTerm = filterCnae.toLowerCase();
        const matchCnae =
          lead.cnaePrincipal.codigo.toLowerCase().includes(cnaeTerm) ||
          lead.cnaePrincipal.descricao.toLowerCase().includes(cnaeTerm);
        if (!matchCnae) return false;
      }

      // UF
      if (filterUf && lead.uf.toUpperCase() !== filterUf.toUpperCase()) {
        return false;
      }

      // Cidade
      if (filterCidade && !lead.municipio.toLowerCase().includes(filterCidade.toLowerCase())) {
        return false;
      }

      // Bairro
      if (filterBairro && !lead.bairro.toLowerCase().includes(filterBairro.toLowerCase())) {
        return false;
      }

      // CEP
      if (filterCep && !lead.cep.replace(/\D/g, '').includes(filterCep.replace(/\D/g, ''))) {
        return false;
      }

      // Situacao
      if (filterSituacao && lead.situacaoCadastral !== filterSituacao) {
        return false;
      }

      // Etapa
      if (filterEtapa && lead.etapaFunil !== filterEtapa) {
        return false;
      }

      // Vendedor
      if (filterVendedor) {
        if (filterVendedor === 'sem_vendedor' && lead.vendedorId) return false;
        if (filterVendedor !== 'sem_vendedor' && lead.vendedorId !== filterVendedor) return false;
      }

      // Atrasados
      if (filterAtrasadosApenas) {
        if (!lead.dataRetorno) return false;
        const isOverdue = new Date(lead.dataRetorno) < new Date(new Date().toDateString());
        if (!isOverdue) return false;
      }

      return true;
    });
  }, [
    leads,
    searchTerm,
    filterCnae,
    filterUf,
    filterCidade,
    filterBairro,
    filterCep,
    filterSituacao,
    filterEtapa,
    filterVendedor,
    filterAtrasadosApenas,
  ]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    exportLeadsToCsv(filteredLeads, isSellerView ? 'meus_leads.csv' : 'leads_gestao_comercial.csv');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCnae('');
    setFilterUf('');
    setFilterCidade('');
    setFilterBairro('');
    setFilterCep('');
    setFilterSituacao('');
    setFilterEtapa('');
    setFilterVendedor('');
    setFilterAtrasadosApenas(false);
    setCurrentPage(1);
  };

  const activeFiltersCount = [
    filterCnae,
    filterUf,
    filterCidade,
    filterBairro,
    filterCep,
    filterSituacao,
    filterEtapa,
    filterVendedor,
    filterAtrasadosApenas,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSellerView ? 'Meus Leads' : 'Gestão de Leads'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isSellerView
              ? 'Visualize e gerencie exclusivamente a sua carteira comercial e próximos passos.'
              : 'Base unificada de empresas, dados cadastrais e distribuição para a equipe.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              activeFiltersCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Search and Quick Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Razão Social, Nome Fantasia, CNPJ ou Cidade..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterEtapa}
              onChange={(e) => {
                setFilterEtapa(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Etapas</option>
              {FUNNEL_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            {!isSellerView && (
              <select
                value={filterVendedor}
                onChange={(e) => {
                  setFilterVendedor(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os Vendedores</option>
                <option value="sem_vendedor">Não distribuídos</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setFilterAtrasadosApenas(!filterAtrasadosApenas)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                filterAtrasadosApenas
                  ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Retornos Atrasados
            </button>
          </div>
        </div>

        {/* Drawer de Filtros Avançados */}
        {showFiltersDrawer && (
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CNAE Principal</label>
              <input
                type="text"
                placeholder="Ex: 4753"
                value={filterCnae}
                onChange={(e) => setFilterCnae(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={filterCidade}
                onChange={(e) => setFilterCidade(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Estado (UF)</label>
              <input
                type="text"
                maxLength={2}
                placeholder="Ex: SP"
                value={filterUf}
                onChange={(e) => setFilterUf(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
              <input
                type="text"
                placeholder="Ex: Centro"
                value={filterBairro}
                onChange={(e) => setFilterBairro(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
              <input
                type="text"
                placeholder="Ex: 01001-000"
                value={filterCep}
                onChange={(e) => setFilterCep(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Situação Cadastral</label>
              <select
                value={filterSituacao}
                onChange={(e) => setFilterSituacao(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">Todas</option>
                <option value="ATIVA">Ativa</option>
                <option value="BAIXADA">Baixada</option>
              </select>
            </div>

            <div className="col-span-full flex justify-end gap-2 pt-2">
              <button
                onClick={clearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1 cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Empresa / CNPJ</th>
                <th className="px-4 py-3.5">CNAE Principal</th>
                <th className="px-4 py-3.5">Localização</th>
                {!isSellerView && <th className="px-4 py-3.5">Responsável</th>}
                <th className="px-4 py-3.5">Etapa do Funil</th>
                <th className="px-4 py-3.5 text-right">Oportunidade</th>
                <th className="px-4 py-3.5">Próximo Retorno</th>
                <th className="px-4 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={isSellerView ? 7 : 8} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Nenhum lead encontrado com os filtros atuais.</p>
                    <p className="text-xs text-slate-400 mt-1">Tente remover alguns filtros ou cadastrar novos leads.</p>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const stageObj = FUNNEL_STAGES.find((s) => s.id === lead.etapaFunil);
                  const isOverdue =
                    lead.dataRetorno && new Date(lead.dataRetorno) < new Date(new Date().toDateString());

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* Empresa */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {lead.razaoSocial}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                          <span>{lead.cnpj}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              lead.situacaoCadastral === 'ATIVA'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {lead.situacaoCadastral}
                          </span>
                        </div>
                      </td>

                      {/* CNAE */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <span className="font-mono text-xs font-semibold text-slate-700 block truncate">
                          {lead.cnaePrincipal.codigo}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {lead.cnaePrincipal.descricao}
                        </span>
                      </td>

                      {/* Localização */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-medium text-slate-800">
                          {lead.municipio}/{lead.uf}
                        </div>
                        <div className="text-[11px] text-slate-400">{lead.bairro}</div>
                      </td>

                      {/* Responsável */}
                      {!isSellerView && (
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                          {lead.vendedorNome ? (
                            <span className="font-semibold text-slate-700">{lead.vendedorNome}</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-semibold text-[11px] border border-amber-200">
                              Disponível
                            </span>
                          )}
                        </td>
                      )}

                      {/* Etapa */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            stageObj ? stageObj.bg + ' ' + stageObj.color : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {stageObj ? stageObj.label : lead.etapaFunil}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right font-bold text-slate-900">
                        R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Próximo Retorno */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        {lead.dataRetorno ? (
                          <div className="flex items-center gap-1.5">
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                              {new Date(lead.dataRetorno + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Visualizar Lead"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Mostrando <strong>{filteredLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> a{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</strong> de{' '}
            <strong>{filteredLeads.length}</strong> leads
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 font-semibold cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-2 font-bold text-slate-800">
              {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 font-semibold cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => {
            // Re-fetch lead from store to reflect updates
            const updated = store.getLeadById(selectedLead.id);
            if (updated) setSelectedLead(updated);
          }}
        />
      )}
    </div>
  );
};
