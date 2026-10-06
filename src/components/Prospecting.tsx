import React, { useState } from 'react';
import { store } from '../services/store';
import { fetchCompanyFromBrasilApi, cleanCnpj, formatCnpj } from '../services/brasilApi';
import { GoogleMapsRadiusProspecting } from './GoogleMapsRadiusProspecting';
import {
  Search,
  Building2,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const Prospecting: React.FC = () => {
  // Apenas as duas opções solicitadas: Consulta de CNPJ e Prospecção de Leads
  const [activeMode, setActiveMode] = useState<'consulta_cnpj' | 'prospeccao_leads'>('consulta_cnpj');

  // Estado unificado da Consulta e Cadastro de CNPJ
  const [cnpjSearchInput, setCnpjSearchInput] = useState('');
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const initialForm = {
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    cnaeCodigo: '',
    cnaeDescricao: '',
    municipio: '',
    uf: 'SP',
    bairro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    cep: '',
    telefone: '',
    email: '',
    situacaoCadastral: 'ATIVA',
    valorOportunidade: 25000,
  };

  const [form, setForm] = useState(initialForm);

  // Consulta por CNPJ
  const handleCnpjSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const clean = cleanCnpj(cnpjSearchInput);
    if (clean.length !== 14) {
      setFeedback({
        type: 'error',
        text: 'O CNPJ precisa conter exatamente 14 dígitos numéricos.',
      });
      return;
    }

    setIsSearchingCnpj(true);
    try {
      const company = await fetchCompanyFromBrasilApi(clean);
      if (company && company.razaoSocial) {
        setForm({
          cnpj: company.cnpj || formatCnpj(clean),
          razaoSocial: company.razaoSocial || '',
          nomeFantasia: company.nomeFantasia || company.razaoSocial || '',
          cnaeCodigo: company.cnaePrincipal?.codigo || '0000-0/00',
          cnaeDescricao: company.cnaePrincipal?.descricao || 'Atividade principal',
          municipio: company.municipio || '',
          uf: (company.uf || 'SP').toUpperCase(),
          bairro: company.bairro || '',
          logradouro: company.logradouro || '',
          numero: company.numero || 'S/N',
          complemento: company.complemento || '',
          cep: company.cep || '',
          telefone: company.telefone || '',
          email: company.email || '',
          situacaoCadastral: company.situacaoCadastral || 'ATIVA',
          valorOportunidade: 25000,
        });

        setFeedback({
          type: 'success',
          text: `Empresa "${company.razaoSocial}" localizada com sucesso! Confira os dados abaixo e clique em "Incluir nos Leads".`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Não foi possível encontrar a empresa com o CNPJ informado.',
      });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  // Salvar / Incluir Lead na base
  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!form.razaoSocial.trim()) {
      setFeedback({
        type: 'error',
        text: 'Informe ao menos a Razão Social da empresa.',
      });
      return;
    }

    const clean = cleanCnpj(form.cnpj);
    const cnpjFormatted = clean.length === 14 ? formatCnpj(clean) : form.cnpj.trim();

    const res = store.addLead({
      cnpj: cnpjFormatted || '00.000.000/0000-00',
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: form.nomeFantasia.trim() || form.razaoSocial.trim(),
      cnaePrincipal: {
        codigo: form.cnaeCodigo || '0000-0/00',
        descricao: form.cnaeDescricao || 'Atividade comercial',
      },
      cnaesSecundarios: [],
      logradouro: form.logradouro.trim() || 'Não informado',
      numero: form.numero.trim() || 'S/N',
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim() || 'Centro',
      municipio: form.municipio.trim() || 'São Paulo',
      uf: form.uf.toUpperCase(),
      cep: form.cep || '00000-000',
      telefone: form.telefone,
      email: form.email.toLowerCase(),
      situacaoCadastral: (form.situacaoCadastral as any) || 'ATIVA',
      origem: 'prospeccao',
      etapaFunil: 'lead_recebido',
      valorOportunidade: Number(form.valorOportunidade) || 20000,
      proximaAcao: 'Novo lead cadastrado - Disponível para dimensionamento na Distribuição',
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        text: `Lead "${form.razaoSocial}" cadastrado com sucesso! Ele já está disponível na aba "Distribuição" para ser direcionado a um vendedor.`,
      });
      setForm(initialForm);
      setCnpjSearchInput('');
    } else {
      setFeedback({
        type: 'error',
        text: res.message || 'Erro ao cadastrar lead.',
      });
    }
  };

  const handleClearForm = () => {
    setForm(initialForm);
    setCnpjSearchInput('');
    setFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prospecção de Empresas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pesquise por CNPJ para capturar dados cadastrais automaticamente ou utilize a prospecção territorial no mapa.
        </p>
      </div>

      {/* Navegação entre as DUAS opções solicitadas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveMode('consulta_cnpj')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeMode === 'consulta_cnpj'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Consulta de CNPJ
        </button>

        <button
          onClick={() => setActiveMode('prospeccao_leads')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeMode === 'prospeccao_leads'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Prospecção de Leads
        </button>
      </div>

      {/* ABA 1: CONSULTA DE CNPJ UNIFICADA COM CADASTRO */}
      {activeMode === 'consulta_cnpj' && (
        <div className="space-y-6">
          {/* Mensagem de Feedback */}
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span>{feedback.text}</span>
              </div>
            </div>
          )}

          {/* Card de Busca de CNPJ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pesquisar por CNPJ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Digite o CNPJ para preencher os dados cadastrais da empresa e incluí-la nos seus Leads.
              </p>
            </div>

            <form onSubmit={handleCnpjSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={cnpjSearchInput}
                  onChange={(e) => setCnpjSearchInput(e.target.value)}
                  placeholder="Ex: 00.000.000/0000-00 ou números"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSearchingCnpj || !cnpjSearchInput.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
              >
                {isSearchingCnpj ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Pesquisando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar CNPJ
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Formulário Unificado com os Dados da Empresa Encontrada */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Dados da Empresa para Inclusão nos Leads
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Os campos preenchidos pela busca de CNPJ podem ser complementados antes de salvar.
                </p>
              </div>

              {form.razaoSocial && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar Formulário
                </button>
              )}
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Razão Social */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razão Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.razaoSocial}
                    onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
                    placeholder="Nome empresarial oficial"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Nome Fantasia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={form.nomeFantasia}
                    onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                    placeholder="Nome comercial ou marca"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Código CNAE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código CNAE</label>
                  <input
                    type="text"
                    value={form.cnaeCodigo}
                    onChange={(e) => setForm({ ...form, cnaeCodigo: e.target.value })}
                    placeholder="Ex: 6201-5/01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Descrição CNAE */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Atividade Principal (CNAE)</label>
                  <input
                    type="text"
                    value={form.cnaeDescricao}
                    onChange={(e) => setForm({ ...form, cnaeDescricao: e.target.value })}
                    placeholder="Descrição da atividade econômica"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Endereço - Logradouro */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro</label>
                  <input
                    type="text"
                    value={form.logradouro}
                    onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Número */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="Ex: 1000 ou S/N"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Complemento */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={form.complemento}
                    onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                    placeholder="Sala, Andar, Galpão..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bairro */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    placeholder="Bairro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Município / Cidade */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.municipio}
                    onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Estado (UF) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.uf}
                    onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                {/* CEP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(11) 0000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Situação Cadastral */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Situação Cadastral</label>
                  <select
                    value={form.situacaoCadastral}
                    onChange={(e) => setForm({ ...form, situacaoCadastral: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ATIVA">ATIVA</option>
                    <option value="BAIXADA">BAIXADA</option>
                    <option value="SUSPENSA">SUSPENSA</option>
                    <option value="INAPTA">INAPTA</option>
                    <option value="NULA">NULA</option>
                  </select>
                </div>

                {/* Valor Estimado da Oportunidade */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Estimado da Oportunidade (R$)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      value={form.valorOportunidade}
                      onChange={(e) => setForm({ ...form, valorOportunidade: Number(e.target.value) })}
                      placeholder="25000"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Ação Principal */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Ao incluir, a empresa entrará na etapa "Lead Recebido" pronta para ser dimensionada aos vendedores.
                </span>

                <button
                  type="submit"
                  disabled={!form.razaoSocial.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Incluir nos Leads
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 2: PROSPECÇÃO DE LEADS (MAPA COM FILTRO DE RAIO E CNAE) */}
      {activeMode === 'prospeccao_leads' && <GoogleMapsRadiusProspecting />}
    </div>
  );
};
