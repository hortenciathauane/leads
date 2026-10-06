import { createClient } from '@supabase/supabase-js';
import { Lead, ContactHistory, AuditLog } from '../types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://kqficacuktdptmeesies.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZmljYWN1a3RkcHRtZWVzaWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDQ3MTAsImV4cCI6MjEwNTkyMDcxMH0.ZC98owI8AC6PRSKh7b90GCDRPTR00IgccJ1KbTZ3S8Q';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// UUID padrão da conta de gestão do sistema presente na tabela "profiles"
export const DEFAULT_SYSTEM_PROFILE_ID = '2c1b9313-f3f2-4bfe-83fa-64ac926c02c3';

// Cache em memória dos IDs válidos de "profiles" para satisfazer FKs do PostgreSQL
export const knownProfileIds = new Set<string>([
  '2c1b9313-f3f2-4bfe-83fa-64ac926c02c3',
  '44d05a40-5b74-4e05-9c37-107f8d45fd81',
]);

export function registerValidProfileId(id: string) {
  if (id && id.length === 36) {
    knownProfileIds.add(id);
  }
}

export function leadToDbRow(lead: Lead) {
  // Apenas atribui vendedor_id se for um UUID válido registrado em "profiles"
  const validVendedorId =
    lead.vendedorId && knownProfileIds.has(lead.vendedorId) ? lead.vendedorId : null;

  return {
    id: lead.id,
    cnpj: lead.cnpj,
    razao_social: lead.razaoSocial,
    nome_fantasia: lead.nomeFantasia || lead.razaoSocial,
    cnae_principal: lead.cnaePrincipal,
    cnaes_secundarios: lead.cnaesSecundarios || [],
    logradouro: lead.logradouro || '',
    numero: lead.numero || 'S/N',
    complemento: lead.complemento || '',
    bairro: lead.bairro || '',
    municipio: lead.municipio,
    uf: lead.uf,
    cep: lead.cep || '',
    telefone: lead.telefone || '',
    email: lead.email || '',
    situacao_cadastral: lead.situacaoCadastral || 'ATIVA',
    origem: lead.origem || 'prospeccao',
    vendedor_id: validVendedorId,
    vendedor_nome: lead.vendedorNome || null,
    etapa_funil: lead.etapaFunil || 'lead_recebido',
    valor_oportunidade: Number(lead.valorOportunidade) || 0,
    motivo_perda: lead.motivoPerda || null,
    proxima_acao: lead.proximaAcao || null,
    data_retorno: lead.dataRetorno || null,
    anotacoes_comerciais: lead.anotacoesComerciais || null,
    dado_original: lead.dadoOriginal || null,
    ultimo_contato_em: lead.ultimoContatoEm || null,
    created_at: lead.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function dbRowToLead(row: any): Lead {
  return {
    id: String(row.id),
    cnpj: row.cnpj,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia || row.razao_social,
    cnaePrincipal: row.cnae_principal || { codigo: '0000-0/00', descricao: 'Atividade comercial' },
    cnaesSecundarios: row.cnaes_secundarios || [],
    logradouro: row.logradouro || '',
    numero: row.numero || 'S/N',
    complemento: row.complemento || '',
    bairro: row.bairro || '',
    municipio: row.municipio || 'São Paulo',
    uf: row.uf || 'SP',
    cep: row.cep || '',
    telefone: row.telefone || '',
    email: row.email || '',
    situacaoCadastral: row.situacao_cadastral || 'ATIVA',
    origem: row.origem || 'prospeccao',
    vendedorId: row.vendedor_id || null,
    vendedorNome: row.vendedor_nome || null,
    etapaFunil: row.etapa_funil || 'lead_recebido',
    valorOportunidade: Number(row.valor_oportunidade) || 0,
    motivoPerda: row.motivo_perda || undefined,
    proximaAcao: row.proxima_acao || undefined,
    dataRetorno: row.data_retorno || undefined,
    anotacoesComerciais: row.anotacoes_comerciais || undefined,
    dadoOriginal: row.dado_original || undefined,
    ultimoContatoEm: row.ultimo_contato_em || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function contactToDbRow(c: ContactHistory) {
  // contact_history.user_id é obrigatório e possui FK para profiles.id
  const validUserId =
    c.userId && knownProfileIds.has(c.userId) ? c.userId : DEFAULT_SYSTEM_PROFILE_ID;

  return {
    id: c.id,
    lead_id: c.leadId,
    user_id: validUserId,
    user_name: c.userName || 'Vendedor',
    tipo: c.tipo,
    descricao: c.descricao,
    data_contato: c.dataContato || new Date().toISOString(),
    data_retorno_agendada: c.dataRetornoAgendada || null,
    created_at: c.createdAt || new Date().toISOString(),
  };
}

export function dbRowToContact(row: any): ContactHistory {
  return {
    id: String(row.id),
    leadId: String(row.lead_id),
    userId: String(row.user_id),
    userName: row.user_name || 'Vendedor',
    tipo: row.tipo,
    descricao: row.descricao,
    dataContato: row.data_contato,
    dataRetornoAgendada: row.data_retorno_agendada || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function auditToDbRow(a: AuditLog) {
  // audit_logs.user_id é obrigatório e possui FK para profiles.id
  const validUserId =
    a.userId && knownProfileIds.has(a.userId) ? a.userId : DEFAULT_SYSTEM_PROFILE_ID;

  return {
    id: a.id,
    lead_id: a.leadId || null,
    lead_nome: a.leadNome || null,
    user_id: validUserId,
    user_name: a.userName || 'Sistema',
    acao: a.acao,
    descricao: a.descricao,
    detalhes: a.detalhes || null,
    created_at: a.createdAt || new Date().toISOString(),
  };
}

export function dbRowToAudit(row: any): AuditLog {
  return {
    id: String(row.id),
    leadId: row.lead_id || undefined,
    leadNome: row.lead_nome || undefined,
    userId: String(row.user_id),
    userName: row.user_name,
    acao: row.acao,
    descricao: row.descricao,
    detalhes: row.detalhes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}
