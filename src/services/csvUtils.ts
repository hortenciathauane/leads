import { Lead } from '../types';
import { formatCnpj, formatPhone, formatCep } from './brasilApi';

export function exportLeadsToCsv(leads: Lead[], filename = 'relatorio-leads.csv') {
  const headers = [
    'CNPJ',
    'Razao Social',
    'Nome Fantasia',
    'CNAE Principal Codigo',
    'CNAE Principal Descricao',
    'Municipio',
    'UF',
    'Bairro',
    'Logradouro',
    'Numero',
    'CEP',
    'Telefone',
    'Email',
    'Situacao Cadastral',
    'Vendedor Responsavel',
    'Etapa do Funil',
    'Valor Oportunidade (R$)',
    'Data de Retorno',
    'Data de Cadastro',
  ];

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((l) => [
    escapeCell(l.cnpj),
    escapeCell(l.razaoSocial),
    escapeCell(l.nomeFantasia || ''),
    escapeCell(l.cnaePrincipal?.codigo || ''),
    escapeCell(l.cnaePrincipal?.descricao || ''),
    escapeCell(l.municipio),
    escapeCell(l.uf),
    escapeCell(l.bairro),
    escapeCell(l.logradouro),
    escapeCell(l.numero),
    escapeCell(l.cep),
    escapeCell(l.telefone),
    escapeCell(l.email),
    escapeCell(l.situacaoCadastral),
    escapeCell(l.vendedorNome || 'Não atribuído'),
    escapeCell(l.etapaFunil),
    escapeCell(l.valorOportunidade.toFixed(2)),
    escapeCell(l.dataRetorno || ''),
    escapeCell(new Date(l.createdAt).toLocaleDateString('pt-BR')),
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSampleCsvTemplate() {
  const sampleHeaders = [
    'cnpj',
    'razao_social',
    'nome_fantasia',
    'cnae_codigo',
    'cnae_descricao',
    'municipio',
    'uf',
    'bairro',
    'logradouro',
    'numero',
    'cep',
    'telefone',
    'email',
    'valor_oportunidade',
  ];

  const sampleRows = [
    [
      '11.222.333/0001-44',
      'ALFA TECNOLOGIA LTDA',
      'ALFA TECH',
      '6201-5/01',
      'Desenvolvimento de software',
      'Campinas',
      'SP',
      'Cambuí',
      'Rua das Palmeiras',
      '120',
      '13024-000',
      '(19) 3211-4455',
      'comercial@alfatech.com.br',
      '45000',
    ],
    [
      '55.666.777/0001-88',
      'BETA LOGISTICA E TRANSPORTES S.A.',
      'BETA EXPRESS',
      '4930-2/02',
      'Transporte rodoviário de carga',
      'Curitiba',
      'PR',
      'CIC',
      'Avenida das Indústrias',
      '450',
      '81000-000',
      '(41) 3344-9988',
      'contato@betaexpress.com.br',
      '78000',
    ],
  ];

  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const content = '\uFEFF' + [sampleHeaders.join(';'), ...sampleRows.map((r) => r.map(escapeCell).join(';'))].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_importacao_leads.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCsvText(csvText: string): Partial<Lead>[] {
  const lines = csvText.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rawHeaders = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const leads: Partial<Lead>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split respecting quotes
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let charIndex = 0; charIndex < rawLine.length; charIndex++) {
      const char = rawLine[charIndex];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    const cleanCells = cells.map((c) => c.replace(/^["']|["']$/g, '').trim());

    const getVal = (headerKey: string): string => {
      const idx = rawHeaders.findIndex((h) => h.includes(headerKey));
      return idx !== -1 && cleanCells[idx] ? cleanCells[idx] : '';
    };

    const rawCnpj = getVal('cnpj');
    if (!rawCnpj) continue;

    const razaoSocial = getVal('razao') || getVal('empresa') || 'Empresa Importada';
    const nomeFantasia = getVal('fantasia') || razaoSocial;
    const cnaeCod = getVal('cnae') || '0000-0/00';
    const cnaeDesc = getVal('desc') || 'Atividade comercial';
    const municipio = getVal('municipio') || getVal('cidade') || 'São Paulo';
    const uf = (getVal('uf') || getVal('estado') || 'SP').toUpperCase().slice(0, 2);
    const bairro = getVal('bairro') || 'Centro';
    const logradouro = getVal('logradouro') || getVal('endereco') || 'Rua Principal';
    const numero = getVal('numero') || 'S/N';
    const cep = getVal('cep') || '00000-000';
    const telefone = getVal('telefone') || getVal('fone') || '';
    const email = getVal('email') || '';
    const valor = parseFloat(getVal('valor').replace(/[^\d.,]/g, '').replace(',', '.')) || 10000;

    leads.push({
      cnpj: formatCnpj(rawCnpj),
      razaoSocial,
      nomeFantasia,
      cnaePrincipal: { codigo: cnaeCod, descricao: cnaeDesc },
      cnaesSecundarios: [],
      logradouro,
      numero,
      bairro,
      municipio,
      uf,
      cep: formatCep(cep),
      telefone: formatPhone(telefone),
      email: email.toLowerCase(),
      situacaoCadastral: 'ATIVA',
      origem: 'importacao_csv',
      etapaFunil: 'lead_recebido',
      valorOportunidade: valor,
    });
  }

  return leads;
}
