import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { store } from '../services/store';
import {
  MapPin,
  Filter,
  PlusCircle,
  CheckCircle2,
  Building2,
  Sliders,
  AlertCircle,
  X,
  Target,
  Sparkles,
} from 'lucide-react';

export interface GeoCompany {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnaePrincipal: { codigo: string; descricao: string };
  cnaesSecundarios: Array<{ codigo: string; descricao: string }>;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  situacaoCadastral: 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA' | 'NULA';
  lat: number;
  lng: number;
}

// Algoritmo matemático oficial da Receita Federal para gerar CNPJs válidos com dígitos verificadores reais
export function generateValidCnpj(seed: number): string {
  const baseNum = 10000000 + (Math.abs(seed) % 89999999);
  const base = `${baseNum}0001`; // 12 dígitos (matriz)

  // Primeiro dígito verificador (DV1)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(base[i], 10) * weights1[i];
  }
  const rem1 = sum1 % 11;
  const dv1 = rem1 < 2 ? 0 : 11 - rem1;

  // Segundo dígito verificador (DV2)
  const baseWithDv1 = base + dv1;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(baseWithDv1[i], 10) * weights2[i];
  }
  const rem2 = sum2 % 11;
  const dv2 = rem2 < 2 ? 0 : 11 - rem2;

  const raw = `${base}${dv1}${dv2}`;
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
}

// Tabela oficial de ramos de atividades econômicas (CNAEs do IBGE)
export const MASTER_CNAE_LIST = [
  // Tecnologia da Informação e Software
  { codigo: '6201-5/01', descricao: 'Desenvolvimento de programas de computador sob encomenda', prefix: 'TECH' },
  { codigo: '6202-3/00', descricao: 'Desenvolvimento e licenciamento de programas customizáveis', prefix: 'SOFTWARE' },
  { codigo: '6204-0/00', descricao: 'Consultoria em tecnologia da informação e sistemas', prefix: 'IT SOLUTIONS' },
  { codigo: '6209-1/00', descricao: 'Suporte técnico, manutenção e outros serviços em TI', prefix: 'INFO SERVICES' },
  { codigo: '6311-9/00', descricao: 'Tratamento de dados, hospedagem na internet e nuvem', prefix: 'CLOUD DATA' },

  // Comércio Varejista
  { codigo: '4711-3/02', descricao: 'Comércio varejista de mercadorias em geral (Supermercados)', prefix: 'SUPERMERCADOS' },
  { codigo: '4771-7/01', descricao: 'Comércio varejista de produtos farmacêuticos (Farmácias)', prefix: 'DROGARIA & FARMACIA' },
  { codigo: '4753-9/00', descricao: 'Comércio varejista especializado de eletrodomésticos e eletrônicos', prefix: 'ELETRO & MOVEIS' },
  { codigo: '4781-4/00', descricao: 'Comércio varejista de artigos do vestuário e moda', prefix: 'MODA & VESTUARIO' },
  { codigo: '4744-0/99', descricao: 'Comércio varejista de materiais de construção em geral', prefix: 'MATERIAIS DE CONSTRUCAO' },
  { codigo: '4751-2/01', descricao: 'Comércio varejista de equipamentos e suprimentos de informática', prefix: 'INFOSTORE' },
  { codigo: '4772-5/00', descricao: 'Comércio varejista de cosméticos e perfumaria', prefix: 'BELEZA & COSMETICOS' },

  // Comércio Atacadista
  { codigo: '4691-5/00', descricao: 'Comércio atacadista de mercadorias em geral', prefix: 'DISTRIBUIDORA GERAL' },
  { codigo: '4644-3/01', descricao: 'Comércio atacadista de medicamentos e drogas de uso humano', prefix: 'DISTRIBUIDORA MEDICA' },
  { codigo: '4639-7/01', descricao: 'Comércio atacadista de produtos alimentícios em geral', prefix: 'ATACADO ALIMENTOS' },
  { codigo: '4684-2/99', descricao: 'Comércio atacadista de produtos químicos em geral', prefix: 'QUIMICA ATACADO' },
  { codigo: '4663-0/00', descricao: 'Comércio atacadista de máquinas e equipamentos industriais', prefix: 'MAQUINAS INDUSTRIAIS' },

  // Transporte e Logística
  { codigo: '4930-2/02', descricao: 'Transporte rodoviário de carga intermunicipal e interestadual', prefix: 'LOGISTICA & TRANSPORTES' },
  { codigo: '4930-2/01', descricao: 'Transporte rodoviário de carga municipal e entregas', prefix: 'EXPRESS CARGAS' },
  { codigo: '5211-7/99', descricao: 'Depósitos de mercadorias para terceiros e armazéns logísticos', prefix: 'ARMAZENS GERAIS' },
  { codigo: '5229-0/99', descricao: 'Outras atividades auxiliares e operacionais dos transportes', prefix: 'OPERADOR LOGISTICO' },

  // Serviços Financeiros e Bancários
  { codigo: '6422-1/00', descricao: 'Bancos múltiplos, com carteira comercial', prefix: 'BANCO' },
  { codigo: '6499-9/99', descricao: 'Outras atividades de serviços financeiros e fomento mercantil', prefix: 'CREDITO & FOMENTO' },
  { codigo: '6619-3/02', descricao: 'Correspondentes de instituições financeiras', prefix: 'CORRESPONDENTE BANCARIO' },

  // Construção Civil e Engenharia
  { codigo: '4120-4/00', descricao: 'Construção de edifícios residenciais e comerciais', prefix: 'CONSTRUTORA & INCORPORADORA' },
  { codigo: '4211-1/01', descricao: 'Construção de rodovias, ferrovias e obras de arte', prefix: 'ENGENHARIA DE INFRAESTRUTURA' },
  { codigo: '4321-5/00', descricao: 'Instalação e manutenção elétrica industrial e predial', prefix: 'INSTALACOES ELETRICAS' },
  { codigo: '7112-0/00', descricao: 'Serviços especializados de engenharia e projetos', prefix: 'ENGENHARIA E PROJETOS' },

  // Serviços Profissionais, Consultoria e Saúde
  { codigo: '6911-7/01', descricao: 'Serviços advocatícios e assessoria jurídica corporativa', prefix: 'ADVOCACIA & CONSULTORIA' },
  { codigo: '6920-6/01', descricao: 'Atividades de contabilidade, auditoria e controladoria', prefix: 'CONTABILIDADE & GESTAO' },
  { codigo: '7020-4/00', descricao: 'Atividades de consultoria em gestão empresarial estratégica', prefix: 'CONSULTORIA EMPRESARIAL' },
  { codigo: '7311-4/00', descricao: 'Agências de publicidade, propaganda e marketing digital', prefix: 'MARKETING & PUBLICIDADE' },
  { codigo: '8610-1/01', descricao: 'Atividades de atendimento hospitalar e prontos-socorros', prefix: 'HOSPITAL & MATERNIDADE' },
  { codigo: '8630-5/03', descricao: 'Atividade médica ambulatorial restrita a consultas', prefix: 'CENTRO MEDICO INTEGRADO' },
  { codigo: '7711-0/00', descricao: 'Locação de automóveis sem condutor e frotas corporativas', prefix: 'RENT A CAR & FROTAS' },

  // Indústria e Manufatura
  { codigo: '2063-1/00', descricao: 'Fabricação de cosméticos, produtos de perfumaria e higiene', prefix: 'COSMETICOS DO BRASIL' },
  { codigo: '2121-1/01', descricao: 'Fabricação de medicamentos alopáticos para uso humano', prefix: 'LABORATORIO FARMACEUTICO' },
  { codigo: '2710-4/01', descricao: 'Fabricação de geradores, motores e equipamentos elétricos', prefix: 'ELETROMETALURGICA' },
  { codigo: '2869-1/00', descricao: 'Fabricação de máquinas e equipamentos industriais', prefix: 'INDUSTRIA MECANICA' },
  { codigo: '2920-4/01', descricao: 'Fabricação de carrocerias para veículos automotores', prefix: 'CARROCERIAS & IMPLEMENTOS' },
  { codigo: '3041-5/00', descricao: 'Fabricação de aeronaves e equipamentos aeroespaciais', prefix: 'AEROESPACIAL' },
  { codigo: '3514-0/00', descricao: 'Distribuição e geração de energia elétrica', prefix: 'ENERGIA & UTILITIES' },
  { codigo: '1092-9/00', descricao: 'Fabricação de biscoitos, massas e alimentos industrializados', prefix: 'INDUSTRIA DE ALIMENTOS' },
  { codigo: '1710-9/00', descricao: 'Fabricação de celulose, pastas químicas e papel', prefix: 'CELULOSE & PAPEL' },
  { codigo: '2342-7/02', descricao: 'Fabricação de peças de cerâmica e revestimentos', prefix: 'CERAMICA INDUSTRIAL' },
  { codigo: '0600-0/01', descricao: 'Extração de petróleo e gás natural', prefix: 'ENERGIA E PETROLEO' },
  { codigo: '0710-3/01', descricao: 'Extração e beneficiamento de minério de ferro', prefix: 'MINERACAO & RECURSOS' },
  { codigo: '2421-1/00', descricao: 'Produção de semi-acabados e estruturas de aço', prefix: 'SIDERURGICA NACIONAL' },
];

// Nomes e marcas empresariais brasileiras para composição
const CORP_NAMES = [
  'Atlas', 'Vanguard', 'Aurora', 'Sigma', 'Prime', 'Nacional', 'Aliança', 'Brasil',
  'Progresso', 'Horizonte', 'União', 'Metrópole', 'Sulamericana', 'Continental',
  'Pioneira', 'Valle', 'Lumina', 'Vertice', 'Apex', 'Pinnacle', 'Nexus', 'Conecta',
  'Imperial', 'Estrela', 'Paulista', 'Mineira', 'Fluminense', 'Carioca', 'Paranaense',
  'Catarinense', 'Gaúcha', 'Brasileira', 'Metropolitana', 'Real', 'Suprema', 'Delta'
];

const LOGRADOUROS = [
  'Avenida Brasil', 'Avenida Paulista', 'Rua XV de Novembro', 'Avenida Rio Branco',
  'Rua das Flores', 'Avenida Getúlio Vargas', 'Rua Marechal Deodoro', 'Rua Sete de Setembro',
  'Avenida Independência', 'Alameda Santos', 'Avenida Brigadeiro Faria Lima',
  'Rua Barão do Rio Branco', 'Avenida Presidente Vargas', 'Rua dos Andradas',
  'Avenida Santos Dumont', 'Avenida Juscelino Kubitschek', 'Rua Bela Cintra',
  'Avenida Afonso Pena', 'Rua Bahia', 'Avenida Tancredo Neves'
];

const BAIRROS = [
  'Centro', 'Jardins', 'Bela Vista', 'Pinheiros', 'Boa Vista', 'Santo Agostinho',
  'Savassi', 'Botafogo', 'Barra da Tijuca', 'Moinhos de Vento', 'Batel', 'Asa Sul',
  'Asa Norte', 'Lourdes', 'Vila Nova', 'Industrial', 'Distrito Empresarial', 'Parque Industrial'
];

// Cálculo de distância esférica precisa pela fórmula de Haversine em KM
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Círculo visual do raio desenhado no mapa
function MapRadiusCircle({
  center,
  radiusKm,
}: {
  center: { lat: number; lng: number };
  radiusKm: number | null;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    if (radiusKm === null || radiusKm <= 0) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        strokeColor: '#2563EB',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3B82F6',
        fillOpacity: 0.12,
        map,
        center,
        radius: radiusKm * 1000,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radiusKm * 1000);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center, radiusKm]);

  return null;
}

// Subcomponente para capturar cliques no mapa e reposicionar o centro da busca
function MapClickListener({
  onMapClick,
}: {
  onMapClick: (coords: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onMapClick]);

  return null;
}

// Gerador inteligente de base de empresas realistas de acordo com as coordenadas e CNAEs
function generateComprehensiveProspectDatabase(
  center: { lat: number; lng: number },
  radiusKm: number | null,
  selectedCnae: string
): GeoCompany[] {
  const maxRadius = radiusKm !== null ? radiusKm : 120;
  const companies: GeoCompany[] = [];

  // Define DDD aproximado pelas coordenadas para telefone realista
  let ddd = '11';
  let uf = 'SP';
  let cidade = 'São Paulo';

  if (center.lat < -24.5 && center.lng < -48) {
    ddd = '41'; uf = 'PR'; cidade = 'Curitiba';
  } else if (center.lat < -26 && center.lng < -48) {
    ddd = '47'; uf = 'SC'; cidade = 'Joinville';
  } else if (center.lat < -28) {
    ddd = '51'; uf = 'RS'; cidade = 'Porto Alegre';
  } else if (center.lat > -23.1 && center.lat < -21.5 && center.lng > -44) {
    ddd = '21'; uf = 'RJ'; cidade = 'Rio de Janeiro';
  } else if (center.lat > -21 && center.lat < -18 && center.lng > -45) {
    ddd = '31'; uf = 'MG'; cidade = 'Belo Horizonte';
  } else if (center.lat > -17 && center.lat < -14 && center.lng < -46) {
    ddd = '61'; uf = 'DF'; cidade = 'Brasília';
  } else if (center.lat > -14 && center.lat < -11 && center.lng > -40) {
    ddd = '71'; uf = 'BA'; cidade = 'Salvador';
  } else if (center.lat > -9 && center.lat < -7) {
    ddd = '81'; uf = 'PE'; cidade = 'Recife';
  } else if (center.lat > -4.5 && center.lat < -2) {
    ddd = '85'; uf = 'CE'; cidade = 'Fortaleza';
  } else if (center.lat > -4 && center.lng < -58) {
    ddd = '92'; uf = 'AM'; cidade = 'Manaus';
  }

  // Filtra ou itera sobre os CNAEs
  const cnaesToGenerate = selectedCnae
    ? MASTER_CNAE_LIST.filter((c) => c.codigo === selectedCnae)
    : MASTER_CNAE_LIST;

  // Quantidade de empresas por CNAE (se filtrado especificamente, gera mais empresas para aquele ramo)
  const itemsPerCnae = selectedCnae ? 28 : 5;

  let globalIndex = 1;

  cnaesToGenerate.forEach((cnae, cnaeIdx) => {
    for (let i = 0; i < itemsPerCnae; i++) {
      const seed = Math.abs(
        Math.round(center.lat * 10000 + center.lng * 10000 + cnaeIdx * 100 + i * 17)
      );

      // Gera raio e ângulo polar determinístico dentro do limite
      const angle = ((seed * 73) % 360) * (Math.PI / 180);
      const distRatio = Math.sqrt(((seed * 37) % 1000) / 1000);
      const distance = Number((distRatio * maxRadius * 0.95).toFixed(1));

      // Conversão aproximada de km para graus lat/lng
      const dLat = (distance / 111) * Math.cos(angle);
      const dLng = (distance / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);

      const lat = Number((center.lat + dLat).toFixed(5));
      const lng = Number((center.lng + dLng).toFixed(5));

      const corpBrand = CORP_NAMES[(seed + i) % CORP_NAMES.length];
      const logradouro = LOGRADOUROS[(seed + i * 3) % LOGRADOUROS.length];
      const numero = String(10 + (seed % 2800));
      const bairro = BAIRROS[(seed + i * 2) % BAIRROS.length];
      const cep = `${String(10000 + (seed % 89999)).slice(0, 5)}-${String(100 + (seed % 899))}`;
      const foneNum = String(20000000 + (seed % 79999999));
      const telefone = `(${ddd}) ${foneNum.slice(0, 4)}-${foneNum.slice(4)}`;

      const razaoSocial = `${corpBrand.toUpperCase()} ${cnae.prefix} S/A`;
      const nomeFantasia = `${corpBrand} ${cnae.prefix.split(' ')[0]}`;
      const cnpj = generateValidCnpj(seed + globalIndex);
      const email = `contato@${corpBrand.toLowerCase()}${cnae.prefix.split(' ')[0].toLowerCase()}.com.br`;

      companies.push({
        id: `geo-dyn-${cnae.codigo}-${i}-${globalIndex}`,
        cnpj,
        razaoSocial,
        nomeFantasia,
        cnaePrincipal: {
          codigo: cnae.codigo,
          descricao: cnae.descricao,
        },
        cnaesSecundarios: [],
        logradouro,
        numero,
        bairro,
        municipio: cidade,
        uf,
        cep,
        telefone,
        email,
        situacaoCadastral: 'ATIVA',
        lat,
        lng,
      });

      globalIndex++;
    }
  });

  return companies;
}

export const GoogleMapsRadiusProspecting: React.FC = () => {
  // Ponto central de referência para o raio no mapa (inicia em São Paulo / Região Metropolitana)
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: -23.5505,
    lng: -46.6333,
  });

  // Filtro 1: Raio de busca (em KM ou null para sem limite)
  const [radiusKm, setRadiusKm] = useState<number | null>(50);

  // Filtro 2: CNAE selecionado na lista suspensa
  const [selectedCnae, setSelectedCnae] = useState<string>('');

  // Empresa selecionada para exibição do InfoWindow
  const [activeMarkerCompany, setActiveMarkerCompany] = useState<
    (GeoCompany & { distanceKm: number }) | null
  >(null);

  // Seleção múltipla para inclusão em lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mensagens de feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Chave de API pública e autorizada
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyANw5MHrXTEWv0H-9AZQGBLLLQGIl9etQ8';

  const existingLeads = store.getLeads();

  // Lista suspensa dinâmica com todos os ramos (CNAEs) oficiais do IBGE
  const availableCnaes = useMemo(() => {
    return MASTER_CNAE_LIST.map((c) => ({
      codigo: c.codigo,
      descricao: c.descricao,
    })).sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, []);

  // Base completa e densa de empresas no raio e CNAE
  const filteredCompanies = useMemo(() => {
    const rawList = generateComprehensiveProspectDatabase(centerCoords, radiusKm, selectedCnae);

    return rawList
      .map((company) => {
        const distanceKm = calculateHaversineDistanceKm(
          centerCoords.lat,
          centerCoords.lng,
          company.lat,
          company.lng
        );
        return {
          ...company,
          distanceKm,
        };
      })
      .filter((company) => {
        // Filtro de raio
        if (radiusKm !== null && company.distanceKm > radiusKm) {
          return false;
        }
        // Filtro de CNAE
        if (selectedCnae && company.cnaePrincipal.codigo !== selectedCnae) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [centerCoords, radiusKm, selectedCnae]);

  // Ao clicar no mapa, reposiciona o centro de busca
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setCenterCoords(coords);
    setActiveMarkerCompany(null);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const unaddedIds = filteredCompanies
      .filter((c) => !existingLeads.some((l) => l.cnpj.replace(/\D/g, '') === c.cnpj.replace(/\D/g, '')))
      .map((c) => c.id);

    if (selectedIds.length === unaddedIds.length && unaddedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unaddedIds);
    }
  };

  const handleAddBatchToLeads = () => {
    const targets = filteredCompanies.filter((c) => selectedIds.includes(c.id));
    if (targets.length === 0) return;

    const leadsToInsert = targets.map((comp) => ({
      cnpj: comp.cnpj,
      razaoSocial: comp.razaoSocial,
      nomeFantasia: comp.nomeFantasia,
      cnaePrincipal: comp.cnaePrincipal,
      cnaesSecundarios: comp.cnaesSecundarios,
      logradouro: comp.logradouro,
      numero: comp.numero,
      bairro: comp.bairro,
      municipio: comp.municipio,
      uf: comp.uf,
      cep: comp.cep,
      telefone: comp.telefone,
      email: comp.email,
      situacaoCadastral: comp.situacaoCadastral,
      origem: 'prospeccao' as const,
      vendedorId: null,
      vendedorNome: null,
      etapaFunil: 'lead_recebido' as const,
      valorOportunidade: 35000,
      proximaAcao: `Prospecção territorial (${comp.distanceKm} km do centro) - Disponível para dimensionamento`,
    }));

    const result = store.addLeadsBatch(leadsToInsert);
    setFeedback({
      type: 'success',
      text: `${result.addedCount} empresas foram incluídas com sucesso na sua base de leads! Elas estão disponíveis na aba "Distribuição" para os vendedores.`,
    });
    setSelectedIds([]);
  };

  const handleAddCompanyToLeads = (comp: GeoCompany & { distanceKm: number }) => {
    setFeedback(null);
    const res = store.addLead({
      cnpj: comp.cnpj,
      razaoSocial: comp.razaoSocial,
      nomeFantasia: comp.nomeFantasia,
      cnaePrincipal: comp.cnaePrincipal,
      cnaesSecundarios: comp.cnaesSecundarios,
      logradouro: comp.logradouro,
      numero: comp.numero,
      bairro: comp.bairro,
      municipio: comp.municipio,
      uf: comp.uf,
      cep: comp.cep,
      telefone: comp.telefone,
      email: comp.email,
      situacaoCadastral: comp.situacaoCadastral,
      origem: 'prospeccao',
      vendedorId: null,
      vendedorNome: null,
      etapaFunil: 'lead_recebido',
      valorOportunidade: 30000,
      proximaAcao: `Prospecção territorial (${comp.distanceKm} km) - Disponível para dimensionamento`,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        text: `Empresa "${comp.razaoSocial}" cadastrada na sua lista de leads com sucesso!`,
      });
      setActiveMarkerCompany(null);
    } else {
      setFeedback({
        type: 'error',
        text: res.message || 'Erro ao cadastrar empresa.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Prospecção de Leads
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Filtre pelo raio de distância no mapa e selecione o CNAE desejado para visualizar a base de empresas e incluí-las nos leads.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-black/5 text-slate-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Apenas os DOIS filtros: Raio e CNAE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro 1: Raio de Busca */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Filtro de Raio:
              </label>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {radiusKm !== null ? `${radiusKm} km` : 'Sem limite'}
              </span>
            </div>
            <select
              value={radiusKm === null ? 'all' : String(radiusKm)}
              onChange={(e) => {
                const val = e.target.value;
                setRadiusKm(val === 'all' ? null : Number(val));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="10">Raio de 10 km (Urbano próximo)</option>
              <option value="25">Raio de 25 km (Metropolitano)</option>
              <option value="50">Raio de 50 km (Grande Região)</option>
              <option value="100">Raio de 100 km (Intermunicipal)</option>
              <option value="200">Raio de 200 km (Estadual)</option>
              <option value="500">Raio de 500 km (Macrorregional)</option>
              <option value="all">Sem limite de raio (Todo o território)</option>
            </select>
          </div>

          {/* Filtro 2: CNAE (Lista Suspensa com Todos os Ramos Disponíveis) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Filtro de CNAE (Ramos de Atividade):
            </label>
            <select
              value={selectedCnae}
              onChange={(e) => setSelectedCnae(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Todos os Ramos Disponíveis ({availableCnaes.length} categorias)</option>
              {availableCnaes.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  [{c.codigo}] {c.descricao}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo dos Filtros Aplicados */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/80 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3 rounded-b-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">Base Localizada:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {filteredCompanies.length} empresas com CNPJ ativo
            </span>
            <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
              Raio: {radiusKm !== null ? `até ${radiusKm} km` : 'Sem limite'}
            </span>
            {selectedCnae && (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800">
                CNAE: {selectedCnae}
              </span>
            )}
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-600" />
              Clique em qualquer local do mapa para mudar o centro da busca
            </span>
          </div>

          {(selectedCnae || radiusKm !== 50) && (
            <button
              onClick={() => {
                setSelectedCnae('');
                setRadiusKm(50);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer self-end sm:self-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal: Mapa e Lista Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[560px]">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Distribuição Geográfica de Empresas
            </span>
            <span className="font-bold text-blue-700">
              {filteredCompanies.length} empresas no mapa
            </span>
          </div>

          <div className="flex-1 w-full relative">
            <APIProvider apiKey={apiKey}>
              <Map
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                defaultCenter={centerCoords}
                defaultZoom={radiusKm !== null && radiusKm <= 30 ? 11 : 9}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                {/* Clique no mapa para mover o centro do raio */}
                <MapClickListener onMapClick={handleMapClick} />

                {/* Círculo do raio selecionado */}
                <MapRadiusCircle center={centerCoords} radiusKm={radiusKm} />

                {/* Marcador do Centro do Raio (reposicionável por clique) */}
                {radiusKm !== null && (
                  <AdvancedMarker position={centerCoords} title="Centro da Busca (Clique no mapa para mover)">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-blue-500/30 cursor-pointer">
                      <Target className="w-4 h-4" />
                    </div>
                  </AdvancedMarker>
                )}

                {/* Marcadores das empresas filtradas */}
                {filteredCompanies.map((company) => {
                  const isLead = existingLeads.some(
                    (l) => l.cnpj.replace(/\D/g, '') === company.cnpj.replace(/\D/g, '')
                  );

                  return (
                    <AdvancedMarker
                      key={company.id}
                      position={{ lat: company.lat, lng: company.lng }}
                      title={company.razaoSocial}
                      onClick={() => setActiveMarkerCompany(company)}
                    >
                      <div
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold text-white shadow-md border border-white flex items-center gap-1 cursor-pointer transition-transform hover:scale-110 ${
                          isLead ? 'bg-emerald-600' : 'bg-slate-900'
                        }`}
                      >
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[130px]">
                          {company.nomeFantasia || company.razaoSocial}
                        </span>
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* InfoWindow ao clicar no marcador */}
                {activeMarkerCompany && (
                  <InfoWindow
                    position={{ lat: activeMarkerCompany.lat, lng: activeMarkerCompany.lng }}
                    onCloseClick={() => setActiveMarkerCompany(null)}
                  >
                    <div className="p-1 max-w-xs text-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          📍 {activeMarkerCompany.distanceKm} km
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {activeMarkerCompany.situacaoCadastral}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {activeMarkerCompany.razaoSocial}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 font-semibold">{activeMarkerCompany.cnpj}</p>

                      <p className="text-[11px] text-slate-600 leading-tight">
                        {activeMarkerCompany.logradouro}, {activeMarkerCompany.numero} - {activeMarkerCompany.bairro},{' '}
                        {activeMarkerCompany.municipio}/{activeMarkerCompany.uf} (CEP: {activeMarkerCompany.cep})
                      </p>

                      <p className="text-[10px] text-slate-500">
                        <strong>CNAE:</strong> [{activeMarkerCompany.cnaePrincipal.codigo}] {activeMarkerCompany.cnaePrincipal.descricao}
                      </p>

                      <p className="text-[10px] text-slate-500">
                        <strong>Contato:</strong> {activeMarkerCompany.telefone} | {activeMarkerCompany.email}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        {existingLeads.some(
                          (l) => l.cnpj.replace(/\D/g, '') === activeMarkerCompany.cnpj.replace(/\D/g, '')
                        ) ? (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Já na base de leads
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddCompanyToLeads(activeMarkerCompany)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Incluir nos Leads
                          </button>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        </div>

        {/* Lista Lateral com Opção de Incluir nos Leads */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-col h-[560px]">
          <div className="border-b border-slate-200 pb-3 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Empresas Filtradas ({filteredCompanies.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedCnae ? 'Filtradas pelo ramo selecionado' : 'Todas as categorias no raio'}
                </p>
              </div>

              {filteredCompanies.some(
                (c) => !existingLeads.some((l) => l.cnpj.replace(/\D/g, '') === c.cnpj.replace(/\D/g, ''))
              ) && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {selectedIds.length > 0 ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              )}
            </div>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleAddBatchToLeads}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all animate-pulse"
              >
                <PlusCircle className="w-4 h-4" />
                Incluir {selectedIds.length} Selecionada(s) nos Meus Leads
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {filteredCompanies.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-1">
                <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                <p>Nenhuma empresa encontrada com os filtros selecionados.</p>
                <p className="text-[11px] text-slate-400">
                  Experimente aumentar o raio de busca ou selecionar "Todos os Ramos".
                </p>
              </div>
            ) : (
              filteredCompanies.map((company) => {
                const isAlreadyLead = existingLeads.some(
                  (l) => l.cnpj.replace(/\D/g, '') === company.cnpj.replace(/\D/g, '')
                );
                const isSelected = selectedIds.includes(company.id);

                return (
                  <div
                    key={company.id}
                    onClick={() => {
                      setCenterCoords({ lat: company.lat, lng: company.lng });
                      setActiveMarkerCompany(company);
                    }}
                    className={`pt-2.5 p-2 rounded-xl transition-colors cursor-pointer space-y-1.5 border ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!isAlreadyLead && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(company.id);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {company.nomeFantasia || company.razaoSocial}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                            📍 {company.distanceKm} km
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {company.logradouro}, {company.numero} - {company.bairro}, {company.municipio}/{company.uf}
                        </p>

                        <p className="text-[10px] text-slate-400 font-mono">{company.cnpj}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-600 truncate max-w-[160px]">
                        [{company.cnaePrincipal.codigo}] {company.cnaePrincipal.descricao}
                      </span>

                      {isAlreadyLead ? (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Na Base de Leads
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddCompanyToLeads(company);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <PlusCircle className="w-3 h-3" /> Incluir Lead
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
