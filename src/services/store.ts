import { User, Lead, ContactHistory, AuditLog, FunnelStage, DistributionBatch } from '../types';
import {
  supabase,
  isSupabaseConfigured,
  leadToDbRow,
  dbRowToLead,
  contactToDbRow,
  dbRowToContact,
  auditToDbRow,
  dbRowToAudit,
  registerValidProfileId,
} from './supabaseClient';

const STORAGE_KEY = 'gestao_de_vendas_data_v5';
const CURRENT_USER_KEY = 'gestao_de_vendas_current_user_v5';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Usuários do sistema com IDs compatíveis com o PostgreSQL/Supabase Auth
const INITIAL_USERS: (User & { passwordHash: string })[] = [
  {
    id: '2c1b9313-f3f2-4bfe-83fa-64ac926c02c3',
    name: 'Diretoria Comercial',
    email: 'gestao@gestao.com.br',
    role: 'gestao',
    active: true,
    phone: '(11) 98765-4321',
    createdAt: '2026-01-10T08:00:00.000Z',
    passwordHash: '123456',
  },
  {
    id: '44d05a40-5b74-4e05-9c37-107f8d45fd81',
    name: 'Carlos Alberto Santos',
    email: 'vendedor1@vendedor.com.br',
    role: 'vendedor',
    active: true,
    phone: '(11) 99123-4567',
    createdAt: '2026-01-15T09:00:00.000Z',
    passwordHash: '123456',
  },
  {
    id: 'c2f0f7d1-1234-4bc5-8123-999999999992',
    name: 'Mariana Duarte Lima',
    email: 'vendedor2@vendedor.com.br',
    role: 'vendedor',
    active: true,
    phone: '(11) 98234-5678',
    createdAt: '2026-01-15T09:30:00.000Z',
    passwordHash: '123456',
  },
];

const INITIAL_LEADS: Lead[] = [];
const INITIAL_CONTACTS: ContactHistory[] = [];
const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export interface AppState {
  users: (User & { passwordHash: string })[];
  leads: Lead[];
  contacts: ContactHistory[];
  auditLogs: AuditLog[];
  distributions: DistributionBatch[];
}

class StoreService {
  private state: AppState;
  private currentUser: User | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.currentUser = this.loadCurrentUser();

    // Sincronização em segundo plano com o Supabase ao iniciar
    if (isSupabaseConfigured) {
      this.syncFromDatabase();
    }
  }

  // Sincronização bidirecional completa com o banco de dados Supabase
  public async syncFromDatabase(): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      // 0. Sincroniza perfis cadastrados no banco
      const { data: dbProfiles } = await supabase.from('profiles').select('id, name, email, role, phone, active');
      if (dbProfiles && dbProfiles.length > 0) {
        dbProfiles.forEach((p) => {
          registerValidProfileId(p.id);
          const existing = this.state.users.find((u) => u.id === p.id || u.email.toLowerCase() === p.email.toLowerCase());
          if (existing) {
            existing.id = p.id;
            existing.name = p.name;
            existing.role = p.role;
            existing.active = p.active;
          } else {
            this.state.users.push({
              id: p.id,
              name: p.name,
              email: p.email,
              role: p.role,
              active: p.active !== false,
              phone: p.phone || '',
              createdAt: new Date().toISOString(),
              passwordHash: '123456',
            });
          }
        });
      }

      // 1. Carrega Leads do Banco Supabase
      const { data: dbLeads, error: leadsErr } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!leadsErr && dbLeads) {
        const remoteLeads = dbLeads.map(dbRowToLead);
        const map = new Map<string, Lead>();
        // Insere primeiro os remotos
        remoteLeads.forEach((l) => map.set(l.id, l));
        // Se houver leads locais criados que ainda não estão no remoto, preserva e persiste
        this.state.leads.forEach((l) => {
          if (!map.has(l.id)) {
            map.set(l.id, l);
            this.persistLead(l);
          }
        });
        this.state.leads = Array.from(map.values());
      }

      // 2. Carrega Histórico de Contatos do Banco
      const { data: dbContacts, error: contactsErr } = await supabase
        .from('contact_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (!contactsErr && dbContacts) {
        this.state.contacts = dbContacts.map(dbRowToContact);
      }

      // 3. Carrega Auditoria do Banco
      const { data: dbLogs, error: logsErr } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!logsErr && dbLogs) {
        this.state.auditLogs = dbLogs.map(dbRowToAudit);
      }

      this.saveState(this.state);
      this.listeners.forEach((l) => l());
    } catch (e) {
      console.warn('Sincronização em segundo plano:', e);
    }
  }

  // Persistência assíncrona para o banco
  public async persistLead(lead: Lead): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const row = leadToDbRow(lead);
      const { error } = await supabase.from('leads').upsert(row);
      if (error) {
        console.error('Falha ao salvar lead no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao salvar lead no banco:', e);
      return false;
    }
  }

  public async persistLeadsBatch(leads: Lead[]): Promise<boolean> {
    if (!isSupabaseConfigured || leads.length === 0) return true;
    try {
      const rows = leads.map(leadToDbRow);
      const { error } = await supabase.from('leads').upsert(rows);
      if (error) {
        console.error('Falha ao salvar lote de leads no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao salvar lote no banco:', e);
      return false;
    }
  }

  public async persistLeadUpdate(lead: Lead): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const row = leadToDbRow(lead);
      const { error } = await supabase.from('leads').update(row).eq('id', lead.id);
      if (error) {
        console.error('Falha ao atualizar lead no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao atualizar lead no banco:', e);
      return false;
    }
  }

  public async persistLeadDelete(leadId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) {
        console.error('Falha ao deletar lead no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao deletar lead no banco:', e);
      return false;
    }
  }

  public async persistContact(contact: ContactHistory): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const row = contactToDbRow(contact);
      const { error } = await supabase.from('contact_history').upsert(row);
      if (error) {
        console.error('Falha ao salvar contato no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao salvar contato no banco:', e);
      return false;
    }
  }

  public async persistAudit(log: AuditLog): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const row = auditToDbRow(log);
      const { error } = await supabase.from('audit_logs').insert(row);
      if (error) {
        console.error('Falha ao registrar auditoria no Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao registrar auditoria no banco:', e);
      return false;
    }
  }

  private loadState(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Erro ao ler estado do localStorage:', e);
    }

    const defaultState: AppState = {
      users: INITIAL_USERS,
      leads: INITIAL_LEADS,
      contacts: INITIAL_CONTACTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      distributions: [],
    };
    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: AppState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  private loadCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Erro ao ler usuário logado:', e);
    }
    // Default: gestao
    return INITIAL_USERS[0];
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveState(this.state);
    this.listeners.forEach((l) => l());
  }

  // --- AUTENTICAÇÃO ---
  public login(emailInput: string, passwordInput: string): { success: boolean; message?: string; user?: User } {
    const cleanEmail = emailInput.trim().toLowerCase();
    const userMatch = this.state.users.find((u) => {
      const uEmail = u.email ? u.email.trim().toLowerCase() : '';
      return uEmail === cleanEmail;
    });

    if (!userMatch) {
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    if (!userMatch.active) {
      return { success: false, message: 'Usuário desativado. Entre em contato com o gestor do sistema.' };
    }

    if (userMatch.passwordHash !== passwordInput) {
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    const { passwordHash: _, ...safeUser } = userMatch;
    this.currentUser = safeUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    this.notify();
    return { success: true, user: safeUser };
  }

  public logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    this.notify();
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // --- LOG DE AUDITORIA ---
  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    const newLog: AuditLog = {
      ...log,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
    this.persistAudit(newLog);
    this.notify();
  }

  public getAuditLogs(): AuditLog[] {
    if (this.currentUser?.role !== 'gestao') {
      return this.state.auditLogs.filter((log) => log.userId === this.currentUser?.id);
    }
    return this.state.auditLogs;
  }

  // --- USUÁRIOS / VENDEDORES ---
  public getUsers(): User[] {
    return this.state.users.map(({ passwordHash: _, ...u }) => u);
  }

  public getSellers(): User[] {
    return this.getUsers().filter((u) => u.role === 'vendedor');
  }

  public createSeller(data: { name: string; email: string; phone?: string; password?: string }): { success: boolean; message?: string } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, message: 'Permissão negada. Apenas a gestão pode cadastrar vendedores.' };
    }

    const emailClean = data.email.trim().toLowerCase();
    const existing = this.state.users.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      return { success: false, message: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const newSellerId = generateUUID();
    registerValidProfileId(newSellerId);

    const newSeller: User & { passwordHash: string } = {
      id: newSellerId,
      name: data.name.trim(),
      email: emailClean,
      phone: data.phone || '',
      role: 'vendedor',
      active: true,
      createdAt: new Date().toISOString(),
      passwordHash: data.password || '123456',
    };

    this.state.users.push(newSeller);
    this.addAuditLog({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      acao: 'Gestão de Usuário',
      descricao: `Novo vendedor cadastrado: ${newSeller.name} (${newSeller.email})`,
    });
    this.notify();
    return { success: true };
  }

  public updateSeller(sellerId: string, updates: { name?: string; email?: string; phone?: string; active?: boolean }): { success: boolean; message?: string } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, message: 'Permissão negada. Apenas gestores podem editar vendedores.' };
    }

    const index = this.state.users.findIndex((u) => u.id === sellerId);
    if (index === -1) {
      return { success: false, message: 'Vendedor não encontrado.' };
    }

    if (updates.email) {
      const emailClean = updates.email.trim().toLowerCase();
      const emailExists = this.state.users.some(
        (u) => u.email.toLowerCase() === emailClean && u.id !== sellerId
      );
      if (emailExists) {
        return { success: false, message: 'Já existe outro usuário cadastrado com este e-mail.' };
      }
      updates.email = emailClean;
    }

    if (updates.name) {
      updates.name = updates.name.trim();
    }

    const previous = { ...this.state.users[index] };
    this.state.users[index] = { ...this.state.users[index], ...updates };

    // Sincroniza o nome do vendedor em todos os leads atribuídos a ele
    if (updates.name && updates.name !== previous.name) {
      this.state.leads.forEach((lead) => {
        if (lead.vendedorId === sellerId) {
          lead.vendedorNome = updates.name!;
          this.persistLeadUpdate(lead);
        }
      });
    }

    this.addAuditLog({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      acao: 'Gestão de Usuário',
      descricao: `Dados cadastrais do vendedor "${previous.name}" atualizados.`,
      detalhes: { anterior: previous, novo: this.state.users[index] },
    });
    this.notify();
    return { success: true };
  }

  public resetSellerPassword(sellerId: string, newPassword = '123456'): { success: boolean; message?: string } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, message: 'Apenas a gestão pode redefinir senhas.' };
    }

    const user = this.state.users.find((u) => u.id === sellerId);
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    user.passwordHash = newPassword;
    this.addAuditLog({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      acao: 'Gestão de Usuário',
      descricao: `Senha do usuário "${user.name}" foi redefinida pelo gestor.`,
    });
    this.notify();
    return { success: true };
  }

  // --- LEADS ---
  public getLeads(): Lead[] {
    if (!this.currentUser) return [];

    if (this.currentUser.role === 'vendedor') {
      const uId = this.currentUser.id;
      const uName = this.currentUser.name.toLowerCase();
      return this.state.leads.filter(
        (l) => l.vendedorId === uId || (l.vendedorNome && l.vendedorNome.toLowerCase() === uName)
      );
    }

    return this.state.leads;
  }

  public getUnassignedLeads(): Lead[] {
    return this.state.leads.filter((l) => !l.vendedorId && !l.vendedorNome);
  }

  public getLeadById(id: string): Lead | undefined {
    return this.state.leads.find((l) => l.id === id);
  }

  public addLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; lead?: Lead; message?: string } {
    const cleanCnpjStr = leadData.cnpj.replace(/\D/g, '');
    const duplicate = this.state.leads.find((l) => l.cnpj.replace(/\D/g, '') === cleanCnpjStr);

    if (duplicate) {
      return {
        success: false,
        message: `Empresa com CNPJ ${leadData.cnpj} já está cadastrada no sistema ("${duplicate.razaoSocial}"). Evite duplicidades.`,
      };
    }

    const newLead: Lead = {
      ...leadData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.leads.unshift(newLead);
    this.persistLead(newLead);

    if (this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        acao: 'Criação de Lead',
        leadId: newLead.id,
        leadNome: newLead.razaoSocial,
        descricao: `Novo lead cadastrado: ${newLead.razaoSocial} (${newLead.cnpj}) - Origem: ${newLead.origem.toUpperCase()}`,
      });
    }

    this.notify();
    return { success: true, lead: newLead };
  }

  public addLeadsBatch(leadsData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]): {
    success: boolean;
    addedCount: number;
    duplicateCount: number;
    leads: Lead[];
  } {
    const existingCnpjs = new Set(this.state.leads.map((l) => l.cnpj.replace(/\D/g, '')));
    const newlyAdded: Lead[] = [];
    let duplicateCount = 0;

    for (const data of leadsData) {
      const clean = data.cnpj.replace(/\D/g, '');
      if (existingCnpjs.has(clean)) {
        duplicateCount++;
        continue;
      }

      existingCnpjs.add(clean);
      const newLead: Lead = {
        ...data,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      newlyAdded.push(newLead);
      this.state.leads.unshift(newLead);
    }

    if (newlyAdded.length > 0) {
      this.persistLeadsBatch(newlyAdded);
    }

    if (newlyAdded.length > 0 && this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        acao: 'Importação em Massa',
        descricao: `${newlyAdded.length} empresas prospectadas foram adicionadas à base de leads (${duplicateCount} duplicidades ignoradas).`,
      });
    }

    this.notify();
    return {
      success: true,
      addedCount: newlyAdded.length,
      duplicateCount,
      leads: newlyAdded,
    };
  }

  public updateLead(leadId: string, updates: Partial<Lead>): { success: boolean; message?: string } {
    const lead = this.state.leads.find((l) => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead não encontrado.' };

    if (this.currentUser?.role === 'vendedor' && lead.vendedorId !== this.currentUser.id && lead.vendedorNome !== this.currentUser.name) {
      return { success: false, message: 'Permissão negada. Você só pode editar seus próprios leads.' };
    }

    const modifiedFields = Object.keys(updates);
    const prevSnapshot = { ...lead };

    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });
    this.persistLeadUpdate(lead);

    if (this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        acao: 'Edição Cadastral',
        leadId: lead.id,
        leadNome: lead.razaoSocial,
        descricao: `Lead "${lead.razaoSocial}" atualizado (${modifiedFields.join(', ')}).`,
        detalhes: { anterior: prevSnapshot, novo: lead, camposModificados: modifiedFields },
      });
    }

    this.notify();
    return { success: true };
  }

  public deleteLead(leadId: string): { success: boolean; message?: string } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, message: 'Permissão negada. Apenas a gestão pode excluir leads.' };
    }

    const index = this.state.leads.findIndex((l) => l.id === leadId);
    if (index === -1) return { success: false, message: 'Lead não encontrado.' };

    const deleted = this.state.leads.splice(index, 1)[0];
    this.state.contacts = this.state.contacts.filter((c) => c.leadId !== leadId);
    this.persistLeadDelete(leadId);

    if (this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        acao: 'Edição Cadastral',
        leadId,
        leadNome: deleted.razaoSocial,
        descricao: `Lead "${deleted.razaoSocial}" (${deleted.cnpj}) foi excluído do sistema.`,
      });
    }

    this.notify();
    return { success: true };
  }

  // --- DISTRIBUIÇÃO E DIMENSIONAMENTO DE LEADS ---
  public distributeLeads(leadIds: string[], vendedorId: string, vendedorNome?: string): { success: boolean; count: number; message?: string } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, count: 0, message: 'Permissão negada.' };
    }

    const sellerObj = this.state.users.find((u) => u.id === vendedorId);
    const resolvedName = sellerObj ? sellerObj.name : (vendedorNome || 'Vendedor');

    let count = 0;
    const updatedLeads: Lead[] = [];

    leadIds.forEach((id) => {
      const lead = this.state.leads.find((l) => l.id === id);
      if (lead) {
        lead.vendedorId = vendedorId;
        lead.vendedorNome = resolvedName;
        if (lead.etapaFunil === 'lead_recebido') {
          lead.etapaFunil = 'primeiro_contato_pendente';
        }
        lead.updatedAt = new Date().toISOString();
        updatedLeads.push(lead);
        count++;
      }
    });

    if (count > 0) {
      this.persistLeadsBatch(updatedLeads);

      const batch: DistributionBatch = {
        id: generateUUID(),
        leadIds,
        vendedorId,
        vendedorNome: resolvedName,
        distribuidoPorId: this.currentUser?.id || 'admin',
        distribuidoPorNome: this.currentUser?.name || 'Diretoria Comercial',
        quantidade: count,
        tipo: 'manual',
        createdAt: new Date().toISOString(),
      };
      this.state.distributions.unshift(batch);

      this.addAuditLog({
        userId: this.currentUser?.id || 'admin',
        userName: this.currentUser?.name || 'Gestão Comercial',
        acao: 'Distribuição',
        descricao: `${count} leads foram dimensionados e atribuídos ao vendedor ${resolvedName}.`,
      });
    }

    this.notify();
    return { success: true, count };
  }

  public distributeEqually(leadIds: string[], sellerIds?: string[]): { success: boolean; message: string; count: number } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, count: 0, message: 'Permissão negada.' };
    }

    const eligibleSellers =
      sellerIds && sellerIds.length > 0
        ? this.getSellers().filter((s) => s.active && sellerIds.includes(s.id))
        : this.getSellers().filter((s) => s.active);

    if (eligibleSellers.length === 0) {
      return { success: false, count: 0, message: 'Não há vendedores ativos selecionados para receber os leads.' };
    }

    if (leadIds.length === 0) {
      return { success: false, count: 0, message: 'Nenhum lead selecionado para distribuição.' };
    }

    let sellerIndex = 0;
    let count = 0;
    const updatedLeads: Lead[] = [];

    leadIds.forEach((id) => {
      const lead = this.state.leads.find((l) => l.id === id);
      if (lead) {
        const targetSeller = eligibleSellers[sellerIndex % eligibleSellers.length];
        lead.vendedorId = targetSeller.id;
        lead.vendedorNome = targetSeller.name;
        if (lead.etapaFunil === 'lead_recebido') {
          lead.etapaFunil = 'primeiro_contato_pendente';
        }
        lead.updatedAt = new Date().toISOString();
        updatedLeads.push(lead);
        sellerIndex++;
        count++;
      }
    });

    if (count > 0) {
      this.persistLeadsBatch(updatedLeads);

      this.addAuditLog({
        userId: this.currentUser?.id || 'admin',
        userName: this.currentUser?.name || 'Gestão Comercial',
        acao: 'Distribuição',
        descricao: `${count} leads foram distribuídos de forma equilibrada entre ${eligibleSellers.length} vendedores ativos.`,
      });
    }

    this.notify();
    return {
      success: true,
      count,
      message: `${count} leads foram distribuídos igualmente entre ${eligibleSellers.length} vendedores.`,
    };
  }

  public reassignAllLeads(fromSellerId: string, toSellerId: string): { success: boolean; count: number; message?: string } {
    if (this.currentUser?.role !== 'gestao') {
      return { success: false, count: 0, message: 'Permissão negada.' };
    }

    const fromSeller = this.state.users.find((u) => u.id === fromSellerId);
    const toSeller = this.state.users.find((u) => u.id === toSellerId);

    if (!fromSeller || !toSeller) {
      return { success: false, count: 0, message: 'Vendedores não encontrados.' };
    }

    const leadsToTransfer = this.state.leads.filter((l) => l.vendedorId === fromSellerId);
    const count = leadsToTransfer.length;

    leadsToTransfer.forEach((lead) => {
      lead.vendedorId = toSeller.id;
      lead.vendedorNome = toSeller.name;
      lead.updatedAt = new Date().toISOString();
    });

    if (count > 0) {
      this.persistLeadsBatch(leadsToTransfer);

      this.addAuditLog({
        userId: this.currentUser?.id || 'admin',
        userName: this.currentUser?.name || 'Gestão Comercial',
        acao: 'Reatribuição',
        descricao: `Toda a carteira de ${fromSeller.name} (${count} leads) foi transferida para ${toSeller.name}.`,
      });
    }

    this.notify();
    return { success: true, count };
  }

  // --- CONTROLE DO FUNIL DE VENDAS ---
  public changeLeadStage(
    leadId: string,
    newStage: FunnelStage,
    optionsOrMotivo?: string | { motivoPerda?: string; valorOportunidade?: number }
  ): { success: boolean; message?: string } {
    const lead = this.state.leads.find((l) => l.id === leadId);
    if (!lead) return { success: false, message: 'Lead não encontrado.' };

    if (this.currentUser?.role === 'vendedor' && lead.vendedorId !== this.currentUser.id && lead.vendedorNome !== this.currentUser.name) {
      return { success: false, message: 'Permissão negada. Você só pode gerenciar as etapas dos seus próprios leads.' };
    }

    const oldStage = lead.etapaFunil;
    lead.etapaFunil = newStage;
    lead.updatedAt = new Date().toISOString();

    const motivo = typeof optionsOrMotivo === 'string' ? optionsOrMotivo : optionsOrMotivo?.motivoPerda;
    const valor = typeof optionsOrMotivo === 'object' ? optionsOrMotivo.valorOportunidade : undefined;

    if (valor !== undefined && !isNaN(valor)) {
      lead.valorOportunidade = Number(valor);
    }

    if (newStage === 'venda_perdida') {
      lead.motivoPerda = motivo || 'Motivo não informado';
    } else {
      delete lead.motivoPerda;
    }

    this.persistLeadUpdate(lead);

    if (this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        acao: 'Mudança no Funil',
        leadId: lead.id,
        leadNome: lead.razaoSocial,
        descricao: `Etapa do lead alterada de "${oldStage}" para "${newStage}"${motivo ? ` (Motivo: ${motivo})` : ''}.`,
      });
    }

    this.notify();
    return { success: true };
  }

  public updateLeadStage(
    leadId: string,
    newStage: FunnelStage,
    optionsOrMotivo?: string | { motivoPerda?: string; valorOportunidade?: number }
  ): { success: boolean; message?: string } {
    return this.changeLeadStage(leadId, newStage, optionsOrMotivo);
  }

  // --- HISTÓRICO DE CONTATOS ---
  public addContact(contactData: Omit<ContactHistory, 'id' | 'createdAt'>): { success: boolean; contact?: ContactHistory; message?: string } {
    const lead = this.state.leads.find((l) => l.id === contactData.leadId);
    if (!lead) return { success: false, message: 'Lead não encontrado.' };

    const newContact: ContactHistory = {
      ...contactData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };

    this.state.contacts.unshift(newContact);
    lead.ultimoContatoEm = newContact.dataContato;
    lead.updatedAt = new Date().toISOString();

    if (newContact.dataRetornoAgendada) {
      lead.dataRetorno = newContact.dataRetornoAgendada;
    }

    this.persistContact(newContact);
    this.persistLeadUpdate(lead);

    if (this.currentUser) {
      this.addAuditLog({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        acao: 'Registro de Contato',
        leadId: lead.id,
        leadNome: lead.razaoSocial,
        descricao: `Novo contato (${newContact.tipo.toUpperCase()}) registrado para o cliente ${lead.razaoSocial}.`,
      });
    }

    this.notify();
    return { success: true, contact: newContact };
  }

  public getContactsByLead(leadId: string): ContactHistory[] {
    return this.state.contacts.filter((c) => c.leadId === leadId);
  }

  public getContactsForLead(leadId: string): ContactHistory[] {
    return this.getContactsByLead(leadId);
  }

  public getDistributions(): DistributionBatch[] {
    return this.state.distributions;
  }
}

export const store = new StoreService();
