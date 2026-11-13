export const RECEIPT_NATURE_OPTIONS = [
  'Honorários Advocatícios Contratuais',
  'Honorários de Êxito (Ad Exitum)',
  'Consulta e Assessoria Jurídica',
  'Elaboração de Parecer / Contrato',
  'Reembolso de Custas e Despesas Processuais',
  'Prestação de Contas / Levantamento de Alvará ou RPV',
  'Acordo Extrajudicial / Judicial',
  'Outros',
] as const;

export const RECEIPT_CONDITION_OPTIONS = [
  'Pagamento à Vista (Quitação Integral)',
  'Entrada / Sinal',
  'Parcela 1 de 2',
  'Parcela 2 de 2',
  'Parcela 1 de 3',
  'Parcela 2 de 3',
  'Parcela 3 de 3',
  'Quitação Final',
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  'PIX',
  'Transferência Bancária (TED/DOC)',
  'Espécie (Dinheiro)',
  'Cheque',
  'Boleto Bancário',
  'Cartão',
] as const;

export const DEFAULT_EMITTER_PROFILES = [
  {
    id: 'profile-marcelo',
    name: 'Marcelo Abrahão Cassini',
    oab: 'OAB/RJ nº 157.095',
    document: '',
  },
  {
    id: 'profile-luiz-geraldo',
    name: 'Luiz Geraldo Motta',
    oab: 'OAB/RJ nº 5.173-D',
    document: '',
  },
  {
    id: 'profile-damaris',
    name: 'Dâmaris Souza da Cunha',
    oab: 'OAB/RJ nº 244.287',
    document: '',
  },
  {
    id: 'profile-escritorio',
    name: 'Luiz Geraldo Motta e Advogados',
    oab: 'Sociedade de Advogados',
    document: '',
  },
] as const;

export const getDefaultDescriptionForNature = (nature: string): string => {
  switch (nature) {
    case 'Honorários Advocatícios Contratuais':
      return 'pagamento de honorários advocatícios contratuais referentes à atuação profissional nos autos do processo em epígrafe.';
    case 'Honorários de Êxito (Ad Exitum)':
      return 'pagamento de honorários advocatícios de êxito (ad exitum) decorrentes do resultado obtido na demanda judicial em epígrafe.';
    case 'Consulta e Assessoria Jurídica':
      return 'prestação de serviços de consulta, orientação e assessoria jurídica especializada.';
    case 'Elaboração de Parecer / Contrato':
      return 'serviços técnicos de elaboração e revisão de parecer jurídico / instrumento contratual.';
    case 'Reembolso de Custas e Despesas Processuais':
      return 'reembolso de custas judiciais, emolumentos cartorários e despesas processuais adiantadas em favor do(a) outorgante.';
    case 'Prestação de Contas / Levantamento de Alvará ou RPV':
      return 'repasse de valores líquidos referentes ao levantamento de alvará judicial / RPV / precatório nos autos do processo em epígrafe, conforme prestação de contas discriminada.';
    case 'Acordo Extrajudicial / Judicial':
      return 'recebimento de valores decorrentes de composição / acordo firmado entre as partes no interesse do(a) pagador(a).';
    default:
      return 'pagamento referente aos serviços jurídicos prestados conforme ajustado entre as partes.';
  }
};

export const getReceiptTitleForNature = (nature: string): string => {
  if (nature === 'Prestação de Contas / Levantamento de Alvará ou RPV') {
    return 'RECIBO DE PRESTAÇÃO DE CONTAS';
  }
  if (nature === 'Reembolso de Custas e Despesas Processuais') {
    return 'RECIBO DE REEMBOLSO DE CUSTAS';
  }
  if (nature === 'Acordo Extrajudicial / Judicial') {
    return 'RECIBO DE QUITAÇÃO / ACORDO';
  }
  return 'RECIBO DE HONORÁRIOS ADVOCATÍCIOS';
};

export const formatCpfCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatCurrencyBR = (value: number): string => {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDateLongBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [year, month, day] = parts;
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return `${day} de ${months[month - 1] || ''} de ${year}`;
};

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const ESPECIAIS = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

const convertThreeDigits = (n: number): string => {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  const parts: string[] = [];

  if (c > 0) parts.push(CENTENAS[c]);
  if (d === 1) {
    parts.push(ESPECIAIS[u]);
  } else {
    if (d > 1) parts.push(DEZENAS[d]);
    if (u > 0) parts.push(UNIDADES[u]);
  }

  return parts.join(' e ');
};

const convertIntegerPart = (num: number): string => {
  if (num === 0) return 'zero';

  const scales = [
    { singular: '', plural: '' },
    { singular: 'mil', plural: 'mil' },
    { singular: 'milhão', plural: 'milhões' },
    { singular: 'bilhão', plural: 'bilhões' },
    { singular: 'trilhão', plural: 'trilhões' },
  ];

  const groups: number[] = [];
  let temp = num;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal === 0) continue;

    if (i === 1 && groupVal === 1) {
      parts.push('mil');
    } else {
      const text = convertThreeDigits(groupVal);
      const scaleName = groupVal === 1 ? scales[i].singular : scales[i].plural;
      parts.push(scaleName ? `${text} ${scaleName}` : text);
    }
  }

  if (parts.length === 1) return parts[0];

  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1);
  const lastGroup = groups[0];
  const needsConjunction = lastGroup > 0 && (lastGroup < 100 || lastGroup % 100 === 0);

  return needsConjunction
    ? `${rest.join(', ')} e ${last}`
    : `${rest.join(', ')} ${last}`;
};

export const valorPorExtenso = (valor: number): string => {
  if (!Number.isFinite(valor) || valor < 0) return 'zero real';

  const totalCents = Math.round(valor * 100);
  if (totalCents === 0) return 'zero real';

  const reais = Math.floor(totalCents / 100);
  const centavos = totalCents % 100;

  const chunks: string[] = [];

  if (reais > 0) {
    const reaisText = convertIntegerPart(reais);
    const isExactMillionOrMore = reais >= 1000000 && reais % 1000000 === 0;
    const unit = reais === 1 ? 'real' : isExactMillionOrMore ? 'de reais' : 'reais';
    chunks.push(`${reaisText} ${unit}`);
  }

  if (centavos > 0) {
    const centavosText = convertIntegerPart(centavos);
    const unit = centavos === 1 ? 'centavo' : 'centavos';
    chunks.push(`${centavosText} ${unit}`);
  }

  return chunks.join(' e ');
};

