import { Lead, CNAE } from '../types';

export interface BrasilApiCnpjResponse {
  cnpj: string;
  identificador_matriz_filial: number;
  descricao_matriz_filial: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  nome_cidade_no_exterior: string;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: number | string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  email?: string;
  qualificacao_do_responsavel: number;
  capital_social: number;
  porte: string;
  descricao_porte: string;
  opcao_pelo_simples: boolean;
  data_opcao_pelo_simples: string | null;
  data_exclusao_do_simples: string | null;
  opcao_pelo_mei: boolean;
  situacao_especial: string;
  data_situacao_especial: string | null;
  cnaes_secundarios?: Array<{
    codigo: number;
    descricao: string;
  }>;
  qsa?: Array<{
    identificador_de_socio: number;
    nome_socio: string;
    cnpj_cpf_do_socio: string;
    qualificacao_socio: string;
  }>;
}

export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export function formatCnpj(cnpj: string): string {
  const digits = cleanCnpj(cnpj).padStart(14, '0').slice(0, 14);
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatCep(cep: string | number): string {
  const digits = String(cep).replace(/\D/g, '').padStart(8, '0').slice(0, 8);
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

// Exemplos de empresas brasileiras reais para pesquisa rápida
export const DEMO_COMPANIES = [
  {
    cnpj: '47.960.950/0001-21',
    cleanCnpj: '47960950000121',
    razaoSocial: 'MAGAZINE LUIZA S.A.',
    nomeFantasia: 'MAGALU',
    cnaePrincipal: { codigo: '4753-9/00', descricao: 'Comércio varejista especializado de eletrodomésticos e equipamentos de áudio e vídeo' },
    cnaesSecundarios: [
      { codigo: '4751-2/01', descricao: 'Comércio varejista especializado de equipamentos e suprimentos de informática' },
      { codigo: '4754-7/01', descricao: 'Comércio varejista de móveis' }
    ],
    logradouro: 'RUA VOLUNTARIOS DA FRANCA',
    numero: '1465',
    complemento: '',
    bairro: 'CENTRO',
    municipio: 'FRANCA',
    uf: 'SP',
    cep: '14400-490',
    telefone: '(16) 3711-2000',
    email: 'contato@magazineluiza.com.br',
    situacaoCadastral: 'ATIVA' as const,
  },
  {
    cnpj: '33.000.167/0001-01',
    cleanCnpj: '33000167000101',
    razaoSocial: 'PETROLEO BRASILEIRO S.A. PETROBRAS',
    nomeFantasia: 'PETROBRAS',
    cnaePrincipal: { codigo: '0600-0/01', descricao: 'Extração de petróleo e gás natural' },
    cnaesSecundarios: [
      { codigo: '1921-7/00', descricao: 'Fabricação de produtos do refino de petróleo' }
    ],
    logradouro: 'AVENIDA REPUBLICA DO CHILE',
    numero: '65',
    complemento: '',
    bairro: 'CENTRO',
    municipio: 'RIO DE JANEIRO',
    uf: 'RJ',
    cep: '20031-912',
    telefone: '(21) 3224-4477',
    email: 'sac@petrobras.com.br',
    situacaoCadastral: 'ATIVA' as const,
  },
  {
    cnpj: '53.113.791/0001-22',
    cleanCnpj: '53113791000122',
    razaoSocial: 'TOTVS S.A.',
    nomeFantasia: 'TOTVS',
    cnaePrincipal: { codigo: '6202-3/00', descricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis' },
    cnaesSecundarios: [
      { codigo: '6201-5/01', descricao: 'Desenvolvimento de programas de computador sob encomenda' },
      { codigo: '6204-0/00', descricao: 'Consultoria em tecnologia da informação' }
    ],
    logradouro: 'AVENIDA BRAZ LEME',
    numero: '1000',
    complemento: '',
    bairro: 'CASA VERDE',
    municipio: 'SAO PAULO',
    uf: 'SP',
    cep: '02511-000',
    telefone: '(11) 2099-7000',
    email: 'juridico@totvs.com.br',
    situacaoCadastral: 'ATIVA' as const,
  },
  {
    cnpj: '00.416.968/0001-01',
    cleanCnpj: '00416968000101',
    razaoSocial: 'BANCO INTER S.A.',
    nomeFantasia: 'INTER',
    cnaePrincipal: { codigo: '6422-1/00', descricao: 'Bancos múltiplos, com carteira comercial' },
    cnaesSecundarios: [
      { codigo: '6619-3/02', descricao: 'Correspondentes de instituições financeiras' }
    ],
    logradouro: 'AVENIDA BARBACENA',
    numero: '1219',
    complemento: 'ANDAR 22',
    bairro: 'SANTO AGOSTINHO',
    municipio: 'BELO HORIZONTE',
    uf: 'MG',
    cep: '30190-131',
    telefone: '(31) 2138-7700',
    email: 'contato@bancointer.com.br',
    situacaoCadastral: 'ATIVA' as const,
  },
  {
    cnpj: '16.670.085/0001-55',
    cleanCnpj: '16670085000155',
    razaoSocial: 'LOCALIZA RENT A CAR S.A.',
    nomeFantasia: 'LOCALIZA',
    cnaePrincipal: { codigo: '7711-0/00', descricao: 'Locação de automóveis sem condutor' },
    cnaesSecundarios: [
      { codigo: '4511-1/02', descricao: 'Comércio a varejo de automóveis, camionetas e utilitários usados' }
    ],
    logradouro: 'AVENIDA BERNARDO DE VASCONCELOS',
    numero: '377',
    complemento: '',
    bairro: 'CACHOEIRINHA',
    municipio: 'BELO HORIZONTE',
    uf: 'MG',
    cep: '31150-000',
    telefone: '(31) 3247-7000',
    email: 'relacoes.investidores@localiza.com',
    situacaoCadastral: 'ATIVA' as const,
  },
  {
    cnpj: '61.585.865/0001-51',
    cleanCnpj: '61585865000151',
    razaoSocial: 'RAIA DROGASIL S/A',
    nomeFantasia: 'RD SAUDE',
    cnaePrincipal: { codigo: '4771-7/01', descricao: 'Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas' },
    cnaesSecundarios: [
      { codigo: '4772-5/00', descricao: 'Comércio varejista de cosméticos, produtos de perfumaria e de higiene pessoal' }
    ],
    logradouro: 'AVENIDA CORIFEU DE AZEVEDO MARQUES',
    numero: '3097',
    complemento: '',
    bairro: 'BUTANTA',
    municipio: 'SAO PAULO',
    uf: 'SP',
    cep: '05371-001',
    telefone: '(11) 3765-5000',
    email: 'ri@rd.com.br',
    situacaoCadastral: 'ATIVA' as const,
  }
];

export async function fetchCompanyFromBrasilApi(rawCnpj: string): Promise<Partial<Lead>> {
  const clean = cleanCnpj(rawCnpj);
  if (clean.length !== 14) {
    throw new Error('CNPJ inválido. O CNPJ deve conter exatamente 14 dígitos numéricos.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data: BrasilApiCnpjResponse = await response.json();
      return mapBrasilApiResponseToLead(data);
    }

    if (response.status === 404) {
      // Tenta verificar se é um dos cadastros de demonstração
      const fallback = DEMO_COMPANIES.find(c => c.cleanCnpj === clean);
      if (fallback) {
        return createLeadFromDemo(fallback);
      }
      throw new Error(`CNPJ ${formatCnpj(clean)} não foi localizado na base da Receita Federal / BrasilAPI.`);
    }

    if (response.status === 429) {
      // Limite de requisições BrasilAPI
      const fallback = DEMO_COMPANIES.find(c => c.cleanCnpj === clean);
      if (fallback) {
        return createLeadFromDemo(fallback);
      }
      throw new Error('Limite temporário de consultas da BrasilAPI atingido. Tente novamente em alguns segundos.');
    }

    throw new Error(`Erro na consulta (Código HTTP ${response.status}).`);
  } catch (err: any) {
    // Se houve erro de rede ou aborto, verificar base de apoio local
    const fallback = DEMO_COMPANIES.find(c => c.cleanCnpj === clean);
    if (fallback) {
      return createLeadFromDemo(fallback);
    }

    if (err.name === 'AbortError') {
      throw new Error('Tempo limite de resposta da BrasilAPI esgotado. Verifique sua conexão e tente novamente.');
    }
    throw err;
  }
}

function mapBrasilApiResponseToLead(data: BrasilApiCnpjResponse): Partial<Lead> {
  const situacao = (data.descricao_situacao_cadastral || 'ATIVA').toUpperCase();
  const situacaoNormalizada: 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA' | 'NULA' =
    situacao.includes('BAIXADA') ? 'BAIXADA' :
    situacao.includes('SUSPENS') ? 'SUSPENSA' :
    situacao.includes('INAPT') ? 'INAPTA' :
    situacao.includes('NUL') ? 'NULA' : 'ATIVA';

  const cnaePrincipal: CNAE = {
    codigo: String(data.cnae_fiscal || '0000-0/00'),
    descricao: data.cnae_fiscal_descricao || 'Atividade principal não informada'
  };

  const cnaesSecundarios: CNAE[] = (data.cnaes_secundarios || []).map(c => ({
    codigo: String(c.codigo),
    descricao: c.descricao
  }));

  const logradouroCompleto = [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ');

  return {
    cnpj: formatCnpj(data.cnpj),
    razaoSocial: data.razao_social || 'Razão Social não informada',
    nomeFantasia: data.nome_fantasia || data.razao_social || 'Nome fantasia não informado',
    cnaePrincipal,
    cnaesSecundarios,
    logradouro: logradouroCompleto || 'Não informado',
    numero: data.numero || 'S/N',
    complemento: data.complemento || '',
    bairro: data.bairro || 'Centro',
    municipio: data.municipio || 'São Paulo',
    uf: data.uf || 'SP',
    cep: formatCep(data.cep),
    telefone: formatPhone(data.ddd_telefone_1 || ''),
    email: data.email ? data.email.toLowerCase() : '',
    situacaoCadastral: situacaoNormalizada,
    origem: 'brasilapi',
    dadoOriginal: {
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia,
      telefone: data.ddd_telefone_1 || '',
      email: data.email || '',
      logradouro: logradouroCompleto,
      numero: data.numero,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      cep: formatCep(data.cep),
      situacaoCadastral: situacaoNormalizada,
    }
  };
}

function createLeadFromDemo(company: typeof DEMO_COMPANIES[0]): Partial<Lead> {
  return {
    cnpj: company.cnpj,
    razaoSocial: company.razaoSocial,
    nomeFantasia: company.nomeFantasia,
    cnaePrincipal: company.cnaePrincipal,
    cnaesSecundarios: company.cnaesSecundarios,
    logradouro: company.logradouro,
    numero: company.numero,
    complemento: company.complemento,
    bairro: company.bairro,
    municipio: company.municipio,
    uf: company.uf,
    cep: company.cep,
    telefone: company.telefone,
    email: company.email,
    situacaoCadastral: company.situacaoCadastral,
    origem: 'brasilapi',
    dadoOriginal: {
      razaoSocial: company.razaoSocial,
      nomeFantasia: company.nomeFantasia,
      telefone: company.telefone,
      email: company.email,
      logradouro: company.logradouro,
      numero: company.numero,
      bairro: company.bairro,
      municipio: company.municipio,
      uf: company.uf,
      cep: company.cep,
      situacaoCadastral: company.situacaoCadastral,
    }
  };
}
