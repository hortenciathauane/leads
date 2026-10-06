import React, { useState } from 'react';
import { store } from '../services/store';
import { User, Lead } from '../types';
import {
  Users,
  UserPlus,
  KeyRound,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Pencil,
} from 'lucide-react';

export const SellerManagement: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSellerLeads, setSelectedSellerLeads] = useState<{ seller: User; leads: Lead[] } | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('123456');

  // Form novo vendedor
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');

  // Form edição de vendedor existente
  const [editingSeller, setEditingSeller] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{
    type: 'success' | 'pendency';
    message: string;
  } | null>(null);

  const sellers = store.getSellers();
  const allLeads = store.getLeads();

  const handleOpenEditModal = (seller: User) => {
    setMessage(null);
    setModalFeedback(null);
    setEditingSeller(seller);
    setEditName(seller.name);
    setEditEmail(seller.email);
    setEditPhone(seller.phone || '');
    setEditActive(seller.active !== false);
  };

  const handleUpdateSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);
    if (!editingSeller) return;

    if (!editName.trim()) {
      setModalFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: O nome do vendedor não pode ficar em branco para prosseguir.',
      });
      return;
    }

    if (!editEmail.trim()) {
      setModalFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: O e-mail do vendedor é obrigatório para prosseguir.',
      });
      return;
    }

    const res = store.updateSeller(editingSeller.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      active: editActive,
    });

    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Dados do vendedor "${editName.trim()}" atualizados com sucesso no banco de dados!`,
      });
      setTimeout(() => {
        setEditingSeller(null);
        setModalFeedback(null);
      }, 1000);
    } else {
      setModalFeedback({
        type: 'pendency',
        message: res.message || 'Erro ao atualizar dados do vendedor.',
      });
    }
  };

  const handleCreateSeller = (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);

    if (!newName.trim()) {
      setModalFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: Preencha o nome do vendedor para prosseguir.',
      });
      return;
    }

    if (!newEmail.trim()) {
      setModalFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: Preencha o e-mail comercial do vendedor.',
      });
      return;
    }

    if (newPassword.length < 4) {
      setModalFeedback({
        type: 'pendency',
        message: 'Pendência: A senha inicial deve ter pelo menos 4 caracteres.',
      });
      return;
    }

    const res = store.createSeller({
      name: newName,
      email: newEmail,
      phone: newPhone,
      password: newPassword,
    });

    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Vendedor "${newName}" cadastrado com sucesso no banco de dados!`,
      });
      setTimeout(() => {
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('123456');
        setModalFeedback(null);
      }, 1000);
    } else {
      setModalFeedback({
        type: 'pendency',
        message: res.message || 'Erro ao cadastrar vendedor.',
      });
    }
  };

  const handleToggleActive = (seller: User) => {
    setMessage(null);
    const newStatus = !seller.active;
    const res = store.updateSeller(seller.id, { active: newStatus });
    if (res.success) {
      setMessage({
        type: 'success',
        text: `Vendedor ${seller.name} foi ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);
    if (!resetPasswordUser) return;

    if (!newPasswordInput.trim()) {
      setModalFeedback({
        type: 'pendency',
        message: 'Pendência obrigatória: Informe a nova senha de acesso.',
      });
      return;
    }

    const res = store.resetSellerPassword(resetPasswordUser.id, newPasswordInput.trim());
    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Senha de acesso para ${resetPasswordUser.name} redefinida com sucesso no banco de dados!`,
      });
      setTimeout(() => {
        setResetPasswordUser(null);
        setNewPasswordInput('123456');
        setModalFeedback(null);
      }, 1000);
    } else {
      setModalFeedback({
        type: 'pendency',
        message: res.message || 'Erro ao redefinir senha.',
      });
    }
  };

  const handleViewLeads = (seller: User) => {
    const leads = allLeads.filter((l) => l.vendedorId === seller.id);
    setSelectedSellerLeads({ seller, leads });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Vendedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastre novos corretores/vendedores, controle permissões, redefina senhas e acompanhe carteiras de clientes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Vendedor
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid de Vendedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sellers.map((seller) => {
          const sellerLeads = allLeads.filter((l) => l.vendedorId === seller.id);
          const wonLeads = sellerLeads.filter((l) => l.etapaFunil === 'venda_concluida');
          const totalWon = wonLeads.reduce((acc, l) => acc + (l.valorOportunidade || 0), 0);
          const conversion = sellerLeads.length > 0 ? ((wonLeads.length / sellerLeads.length) * 100).toFixed(1) : '0.0';

          return (
            <div
              key={seller.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                seller.active ? 'border-slate-200' : 'border-slate-300 opacity-70 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {seller.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      seller.active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {seller.active ? 'Conta Ativa' : 'Desativado'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{seller.name}</h3>
                <div className="space-y-1 text-xs text-slate-500 mt-2">
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {seller.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {seller.phone || 'Telefone não informado'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Leads</span>
                    <p className="text-sm font-bold text-slate-800">{sellerLeads.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Vendas</span>
                    <p className="text-sm font-bold text-emerald-600">{wonLeads.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Conversão</span>
                    <p className="text-sm font-bold text-slate-800">{conversion}%</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-center justify-between">
                  <span>Faturamento acumulado:</span>
                  <strong className="text-slate-900">
                    R$ {totalWon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Ações da Gestão */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleViewLeads(seller)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Ver Carteira ({sellerLeads.length})
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(seller)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                    title="Editar Dados do Vendedor"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(seller)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                    title="Redefinir Senha"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(seller)}
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      seller.active
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={seller.active ? 'Desativar vendedor' : 'Ativar vendedor'}
                  >
                    {seller.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar Vendedor */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Cadastrar Novo Vendedor
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                  modalFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border-amber-200'
                }`}
              >
                {modalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold block">
                    {modalFeedback.type === 'success' ? 'Sucesso!' : 'Atenção: Pendência para prosseguir'}
                  </span>
                  <span>{modalFeedback.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSeller} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Comercial *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vendedor@empresa.com.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha Inicial de Acesso *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Salvar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Redefinir Senha */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              Redefinir Senha do Vendedor
            </h3>
            <p className="text-xs text-slate-500">
              Informe a nova senha temporária para <strong>{resetPasswordUser.name}</strong> ({resetPasswordUser.email}).
            </p>

            {modalFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                  modalFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border-amber-200'
                }`}
              >
                {modalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold block">
                    {modalFeedback.type === 'success' ? 'Sucesso!' : 'Atenção: Pendência para prosseguir'}
                  </span>
                  <span>{modalFeedback.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nova Senha</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Carteira de Leads do Vendedor */}
      {selectedSellerLeads && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Carteira de Clientes: {selectedSellerLeads.seller.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedSellerLeads.leads.length} leads atribuídos</p>
              </div>
              <button
                onClick={() => setSelectedSellerLeads(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {selectedSellerLeads.leads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Este vendedor ainda não possui nenhum lead atribuído.
                </div>
              ) : (
                selectedSellerLeads.leads.map((l) => (
                  <div key={l.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{l.razaoSocial}</p>
                      <p className="text-[11px] text-slate-500">
                        {l.cnpj} • {l.municipio}/{l.uf}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-blue-700 block">{l.etapaFunil}</span>
                      <span className="font-bold text-slate-800">
                        R$ {l.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSellerLeads(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Vendedor */}
      {editingSeller && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Editar Dados do Vendedor
              </h3>
              <button
                onClick={() => setEditingSeller(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Atualize as informações cadastrais e permissões de acesso do vendedor.
            </p>

            {modalFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                  modalFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                    : 'bg-amber-50 text-amber-950 border-amber-200'
                }`}
              >
                {modalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-bold block">
                    {modalFeedback.type === 'success' ? 'Sucesso!' : 'Atenção: Pendência para prosseguir'}
                  </span>
                  <span>{modalFeedback.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateSellerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Comercial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="vendedor@empresa.com.br"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Vendedor ativo no sistema (pode fazer login e receber leads)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSeller(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-500/20 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
