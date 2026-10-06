export type UserRole = 'gestao' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export type FunnelStage =
  | 'lead_recebido'
  | 'primeiro_contato_pendente'
  | 'em_contato'
  | 'qualificado'
  | 'reuniao_agendada'
  | 'proposta_enviada'
  | 'em_negociacao'
  | 'venda_concluida'
  | 'venda_perdida';

export const FUNNEL_STAGES: { id: FunnelStage; label: string; order: number; color: string; bg: string }[] = [
  { id: 'lead_recebido', label: '1. Lead recebido', order: 1, color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
  { id: 'primeiro_contato_pendente', label: '2. Primeiro contato pendente', order: 2, color: 'text-amber-800', bg: 'bg-amber-50 border-amber-300' },
  { id: 'em_contato', label: '3. Em contato', order: 3, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
  { id: 'qualificado', label: '4. Qualificado', order: 4, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-300' },
  { id: 'reuniao_agendada', label: '5. Reunião agendada', order: 5, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-300' },
  { id: 'proposta_enviada', label: '6. Proposta enviada', order: 6, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-300' },
  { id: 'em_negociacao', label: '7. Em negociação', order: 7, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  { id: 'venda_concluida', label: '8. Venda concluída', order: 8, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
  { id: 'venda_perdida', label: '9. Venda perdida', order: 9, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-300' },
];

export interface CNAE {
  codigo: string;
  descricao: string;
}

export interface Lead {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnaePrincipal: CNAE;
  cnaesSecundarios: CNAE[];
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  situacaoCadastral: 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA' | 'NULA';
  origem: 'brasilapi' | 'manual' | 'importacao_csv' | 'prospeccao';
  vendedorId?: string | null;
  vendedorNome?: string | null;
  etapaFunil: FunnelStage;
  valorOportunidade: number;
  motivoPerda?: string;
  dataRetorno?: string; // YYYY-MM-DD
  proximaAcao?: string;
  anotacoesComerciais?: string;
  createdAt: string;
  updatedAt: string;
  ultimoContatoEm?: string;
  dadoOriginal?: {
    razaoSocial: string;
    nomeFantasia: string;
    telefone: string;
    email: string;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    situacaoCadastral: string;
  };
}

export type ContactType = 'ligacao' | 'whatsapp' | 'email' | 'reuniao' | 'nota';

export interface ContactHistory {
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  tipo: ContactType;
  descricao: string;
  dataContato: string;
  dataRetornoAgendada?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  leadId?: string;
  leadNome?: string;
  userId: string;
  userName: string;
  acao:
    | 'Criação de Lead'
    | 'Edição Cadastral'
    | 'Mudança no Funil'
    | 'Distribuição'
    | 'Reatribuição'
    | 'Registro de Contato'
    | 'Gestão de Usuário'
    | 'Importação em Massa';
  descricao: string;
  detalhes?: Record<string, any>;
  createdAt: string;
}

export interface DistributionBatch {
  id: string;
  leadIds: string[];
  vendedorId: string;
  vendedorNome: string;
  distribuidoPorId: string;
  distribuidoPorNome: string;
  quantidade: number;
  tipo: 'equilibrada' | 'manual';
  createdAt: string;
}
