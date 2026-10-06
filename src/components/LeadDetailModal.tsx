import React, { useState } from 'react';
import { Lead, FunnelStage, FUNNEL_STAGES, ContactType, ContactHistory } from '../types';
import { store } from '../services/store';
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  History,
  FileEdit,
  Save,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdated: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdated }) => {
  const currentUser = store.getCurrentUser();
  const isGestao = currentUser?.role === 'gestao';

  const [activeTab, setActiveTab] = useState<'dados' | 'comercial' | 'contatos' | 'historico'>('dados');
  const [isEditingData, setIsEditingData] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    razaoSocial: lead.razaoSocial,
    nomeFantasia: lead.nomeFantasia || '',
    telefone: lead.telefone,
    email: lead.email,
    logradouro: lead.logradouro,
    numero: lead.numero,
    bairro: lead.bairro,
    municipio: lead.municipio,
    uf: lead.uf,
    cep: lead.cep,
    situacaoCadastral: lead.situacaoCadastral,
    cnaePrincipalCodigo: lead.cnaePrincipal.codigo,
    cnaePrincipalDescricao: lead.cnaePrincipal.descricao,
  });

  // Commercial state
  const [etapaFunil, setEtapaFunil] = useState<FunnelStage>(lead.etapaFunil);
  const [valorOportunidade, setValorOportunidade] = useState(lead.valorOportunidade);
  const [proximaAcao, setProximaAcao] = useState(lead.proximaAcao || '');
  const [dataRetorno, setDataRetorno] = useState(lead.dataRetorno || '');
  const [anotacoesComerciais, setAnotacoesComerciais] = useState(lead.anotacoesComerciais || '');
  const [motivoPerda, setMotivoPerda] = useState(lead.motivoPerda || '');
  const [isSavingCommercial, setIsSavingCommercial] = useState(false);

  // Feedback & Pendency notification state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'pendency';
    message: string;
  } | null>(null);

  // New Contact state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactType, setContactType] = useState<ContactType>('ligacao');
  const [contactDesc, setContactDesc] = useState('');
  const [contactNextDate, setContactNextDate] = useState('');

  const contacts = store.getContactsForLead(lead.id);
  const auditLogs = store.getAuditLogs().filter((l) => l.leadId === lead.id);

  // Check if overdue
  const isOverdue = lead.dataRetorno && new Date(lead.dataRetorno) < new Date(new Date().toDateString());

  const handleSaveCadastral = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validação de pendências para prosseguir
    if (!formData.razaoSocial.trim()) {
      setFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: O campo Razão Social não pode ficar em branco para salvar.',
      });
      return;
    }

    if (!formData.municipio.trim() || !formData.uf.trim()) {
      setFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: O Município e UF são obrigatórios para prosseguir.',
      });
      return;
    }

    const res = store.updateLead(lead.id, {
      razaoSocial: formData.razaoSocial.trim(),
      nomeFantasia: formData.nomeFantasia.trim(),
      telefone: formData.telefone.trim(),
      email: formData.email.trim(),
      logradouro: formData.logradouro.trim(),
      numero: formData.numero.trim(),
      bairro: formData.bairro.trim(),
      municipio: formData.municipio.trim(),
      uf: formData.uf.trim(),
      cep: formData.cep.trim(),
      situacaoCadastral: formData.situacaoCadastral,
      cnaePrincipal: {
        codigo: formData.cnaePrincipalCodigo,
        descricao: formData.cnaePrincipalDescricao,
      },
    });

    if (res.success) {
      setIsEditingData(false);
      onUpdated();
      setFeedback({
        type: 'success',
        message: 'Atualizações cadastrais salvas com sucesso no banco de dados!',
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setFeedback({
        type: 'pendency',
        message: res.message || 'Erro ao salvar os dados cadastrais.',
      });
    }
  };

  const handleSaveCommercial = () => {
    setFeedback(null);

    // Validação de pendências para prosseguir
    if (etapaFunil === 'venda_perdida' && !motivoPerda.trim()) {
      setFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: Informe o motivo da perda da venda para prosseguir e registrar a atualização.',
      });
      return;
    }

    if (Number(valorOportunidade) < 0) {
      setFeedback({
        type: 'pendency',
        message: 'Pendência: O valor da oportunidade não pode ser negativo.',
      });
      return;
    }

    setIsSavingCommercial(true);
    const updateRes = store.updateLead(lead.id, {
      valorOportunidade: Number(valorOportunidade) || 0,
      proximaAcao: proximaAcao.trim(),
      dataRetorno: dataRetorno || undefined,
      anotacoesComerciais: anotacoesComerciais.trim(),
      motivoPerda: etapaFunil === 'venda_perdida' ? motivoPerda.trim() : undefined,
    });

    if (!updateRes.success) {
      setIsSavingCommercial(false);
      setFeedback({
        type: 'pendency',
        message: updateRes.message || 'Erro ao salvar alterações comerciais.',
      });
      return;
    }

    if (etapaFunil !== lead.etapaFunil) {
      store.updateLeadStage(lead.id, etapaFunil, {
        motivoPerda: etapaFunil === 'venda_perdida' ? motivoPerda.trim() : undefined,
        valorOportunidade: Number(valorOportunidade) || 0,
      });
    }

    setIsSavingCommercial(false);
    onUpdated();

    setFeedback({
      type: 'success',
      message: 'Atualização comercial salva com sucesso no banco de dados!',
    });

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!contactDesc.trim()) {
      setFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: Preencha o resumo do contato para prosseguir com o registro.',
      });
      return;
    }

    const res = store.addContact({
      leadId: lead.id,
      userId: currentUser!.id,
      userName: currentUser!.name,
      tipo: contactType,
      descricao: contactDesc.trim(),
      dataContato: new Date().toISOString(),
      dataRetornoAgendada: contactNextDate || undefined,
    });

    if (res.success) {
      setContactDesc('');
      setContactNextDate('');
      setShowAddContact(false);
      onUpdated();

      setFeedback({
        type: 'success',
        message: 'Novo contato registrado e salvo com sucesso no banco de dados!',
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setFeedback({
        type: 'pendency',
        message: res.message || 'Erro ao registrar contato.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">{lead.razaoSocial}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {lead.cnpj}
                </span>
                {isOverdue && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <AlertTriangle className="w-3 h-3" />
                    Retorno Atrasado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {lead.municipio} - {lead.uf} • Responsável:{' '}
                <span className="font-semibold text-slate-200">{lead.vendedorNome || 'Não distribuído'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Sinalização de Sucesso ou Pendência */}
        {feedback && (
          <div
            className={`px-6 py-3.5 flex items-center justify-between border-b transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200 shadow-xs'
                : 'bg-amber-50 text-amber-950 border-amber-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold leading-tight">
                  {feedback.type === 'success'
                    ? 'Atualização realizada com sucesso!'
                    : 'Atenção: Pendência para prosseguir'}
                </p>
                <p className="text-xs opacity-90 mt-0.5 leading-snug">{feedback.message}</p>
              </div>
            </div>

            {feedback.type === 'success' ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shrink-0 animate-pulse">
                Fechando pop-up...
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-1 hover:bg-amber-200/50 rounded-lg text-amber-800 cursor-pointer transition-colors"
                title="Fechar aviso de pendência"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 text-sm font-medium">
          <button
            onClick={() => setActiveTab('dados')}
            className={`py-3 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'dados'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Dados Cadastrais
          </button>
          <button
            onClick={() => setActiveTab('comercial')}
            className={`py-3 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'comercial'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Gestão Comercial & Funil
          </button>
          <button
            onClick={() => setActiveTab('contatos')}
            className={`py-3 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'contatos'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Contatos ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`py-3 px-4 border-b-2 font-medium cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'historico'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Auditoria ({auditLogs.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800">
          {/* TAB 1: DADOS CADASTRAIS */}
          {activeTab === 'dados' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Informações Cadastrais da Empresa</h3>
                  <p className="text-xs text-slate-500">
                    Origem dos dados: <span className="font-semibold uppercase">{lead.origem}</span>
                  </p>
                </div>
                {!isEditingData ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingData(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    Editar Dados
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingData(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              {!isEditingData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-slate-400">Razão Social</span>
                      <p className="text-sm font-semibold text-slate-900">{lead.razaoSocial}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400">Nome Fantasia</span>
                      <p className="text-sm font-medium text-slate-800">{lead.nomeFantasia || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400">Situação Cadastral</span>
                      <p className="text-sm">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            lead.situacaoCadastral === 'ATIVA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {lead.situacaoCadastral}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400">CNAE Principal</span>
                      <p className="text-xs font-medium text-slate-900">
                        <span className="font-mono bg-slate-200 px-1 rounded mr-1">
                          {lead.cnaePrincipal.codigo}
                        </span>
                        {lead.cnaePrincipal.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-slate-400">Localização e Endereço</span>
                      <p className="text-sm font-medium text-slate-800 flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {lead.logradouro}, {lead.numero}
                          {lead.complemento ? ` - ${lead.complemento}` : ''}
                          <br />
                          {lead.bairro} — {lead.municipio}/{lead.uf}
                          <br />
                          CEP: {lead.cep}
                        </span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium text-slate-400">Telefone</span>
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {lead.telefone || '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-400">E-mail</span>
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {lead.email || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {lead.dadoOriginal && (
                    <div className="col-span-full bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                      <span className="font-bold flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Dado Original Preservado (Consulta Cadastral Inicial)
                      </span>
                      <p className="text-blue-800">
                        {lead.dadoOriginal.razaoSocial} | Tel: {lead.dadoOriginal.telefone || 'Não informado'} | Endereço: {lead.dadoOriginal.logradouro}, {lead.dadoOriginal.numero} ({lead.dadoOriginal.municipio}/{lead.dadoOriginal.uf})
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveCadastral} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social</label>
                      <input
                        type="text"
                        value={formData.razaoSocial}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Nome Fantasia</label>
                      <input
                        type="text"
                        value={formData.nomeFantasia}
                        onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Logradouro</label>
                      <input
                        type="text"
                        value={formData.logradouro}
                        onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Número</label>
                        <input
                          type="text"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Bairro</label>
                        <input
                          type="text"
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                        <input
                          type="text"
                          value={formData.municipio}
                          onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">UF</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={formData.uf}
                          onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">CEP</label>
                      <input
                        type="text"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingData(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: GESTÃO COMERCIAL E FUNIL */}
          {activeTab === 'comercial' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Etapa Atual no Funil Comercial</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FUNNEL_STAGES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEtapaFunil(s.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        etapaFunil === s.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {etapaFunil === 'venda_perdida' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Motivo da Perda (Obrigatório para auditoria)
                    </label>
                    <input
                      type="text"
                      value={motivoPerda}
                      onChange={(e) => setMotivoPerda(e.target.value)}
                      placeholder="Ex: Preço acima do orçamento, optou por concorrente..."
                      required
                      className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-sm text-rose-950 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Valor Estimado da Oportunidade (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold">
                      R$
                    </span>
                    <input
                      type="number"
                      value={valorOportunidade}
                      onChange={(e) => setValorOportunidade(Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data do Próximo Retorno / Follow-up
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dataRetorno}
                      onChange={(e) => setDataRetorno(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                        isOverdue ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {isOverdue && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
                      ⚠️ Atenção: Esta data está vencida. Atualize a data de retorno.
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Próxima Ação Planejada
                  </label>
                  <input
                    type="text"
                    value={proximaAcao}
                    onChange={(e) => setProximaAcao(e.target.value)}
                    placeholder="Ex: Enviar proposta comercial ajustada por e-mail"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Anotações Comerciais Internas
                  </label>
                  <textarea
                    rows={3}
                    value={anotacoesComerciais}
                    onChange={(e) => setAnotacoesComerciais(e.target.value)}
                    placeholder="Registre observações estratégicas sobre este cliente..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSaveCommercial}
                  disabled={isSavingCommercial}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Gestão Comercial
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CONTATOS */}
          {activeTab === 'contatos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Histórico de Contatos e Interações</h3>
                  <p className="text-xs text-slate-500">
                    Último contato registrado em:{' '}
                    {lead.ultimoContatoEm
                      ? new Date(lead.ultimoContatoEm).toLocaleString('pt-BR')
                      : 'Nenhum contato até o momento'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Registrar Contato
                </button>
              </div>

              {showAddContact && (
                <form
                  onSubmit={handleAddContactSubmit}
                  className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Novo Registro</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Interação</label>
                      <select
                        value={contactType}
                        onChange={(e) => setContactType(e.target.value as ContactType)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="ligacao">Ligação Telefônica</option>
                        <option value="whatsapp">WhatsApp / Mensagem</option>
                        <option value="email">E-mail Comercial</option>
                        <option value="reuniao">Reunião (Presencial / Online)</option>
                        <option value="nota">Nota Interna</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Agendar Próximo Retorno (Opcional)
                      </label>
                      <input
                        type="date"
                        value={contactNextDate}
                        onChange={(e) => setContactNextDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Descrição do Contato / Resumo da Conversa
                      </label>
                      <textarea
                        rows={3}
                        value={contactDesc}
                        onChange={(e) => setContactDesc(e.target.value)}
                        required
                        placeholder="Ex: Conversado com o decisor Sr. André. Solicitou apresentação para a próxima quinta-feira..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Salvar Registro
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Nenhum contato registrado para esta empresa.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Clique em "Registrar Contato" para registrar ligações, e-mails ou reuniões.
                    </p>
                  </div>
                ) : (
                  contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase px-2 py-0.5 rounded bg-slate-100">
                            {c.tipo}
                          </span>
                          <span>por <strong className="text-slate-800">{c.userName}</strong></span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(c.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{c.descricao}</p>
                      {c.dataRetornoAgendada && (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-blue-700">
                          <Calendar className="w-3.5 h-3.5" />
                          Retorno agendado para:{' '}
                          {new Date(c.dataRetornoAgendada + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AUDITORIA */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Histórico de Alterações e Movimentações</h3>
              <p className="text-xs text-slate-500">
                Auditoria completa das modificações efetuadas neste lead (imutável para vendedores).
              </p>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{log.acao}</span>
                        <span className="text-slate-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-xs text-slate-700">{log.descricao}</p>
                      <p className="text-[11px] text-slate-500">Responsável: {log.userName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
