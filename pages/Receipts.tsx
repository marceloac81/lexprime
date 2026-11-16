import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt as ReceiptIcon,
  Printer,
  Save,
  Search,
  Copy,
  Edit,
  Trash2,
  Plus,
  Scissors,
  Scale,
  FileCheck,
  User,
  Briefcase,
  Calculator,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useStore } from '../context/Store';
import { Receipt } from '../types';
import { formatCNJ } from '../utils/cnjUtils';
import { normalizeText } from '../utils/textUtils';
import {
  RECEIPT_NATURE_OPTIONS,
  RECEIPT_CONDITION_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  DEFAULT_EMITTER_PROFILES,
  getDefaultDescriptionForNature,
  getReceiptTitleForNature,
  formatCpfCnpj,
  formatCurrencyBR,
  formatDateLongBR,
  valorPorExtenso,
} from '../utils/receiptUtils';

const EMITTER_DOC_CACHE_KEY = 'lexprime_emitter_docs';

const loadEmitterDocCache = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(EMITTER_DOC_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveEmitterDocCache = (cache: Record<string, string>) => {
  try {
    localStorage.setItem(EMITTER_DOC_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
};

const getTodayLocal = () => new Date().toLocaleDateString('en-CA');

const getNextReceiptNumber = (receipts: Receipt[], dateStr: string): string => {
  const year = (dateStr || getTodayLocal()).slice(0, 4) || String(new Date().getFullYear());
  let maxSeq = 0;
  for (const r of receipts) {
    const match = r.receiptNumber?.match(/^(\d+)\s*\/\s*(\d{4})$/);
    if (match && match[2] === year) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return `${String(maxSeq + 1).padStart(3, '0')}/${year}`;
};

const escapeHtml = (str: string): string =>
  (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatOabLabel = (rawOab?: string): string => {
  const clean = (rawOab || '').trim();
  if (!clean) return '';
  if (/^oab/i.test(clean)) return clean;
  const ufMatch = clean.match(/^(.*?)\s*\/\s*([A-Za-z]{2})$/);
  if (ufMatch) {
    return `OAB/${ufMatch[2].toUpperCase()} nº ${ufMatch[1].trim()}`;
  }
  return `OAB/RJ nº ${clean}`;
};

const formatDescriptionConnector = (rawDesc: string): string => {
  const desc = (rawDesc || '').trim();
  if (!desc) return ', referente a ...';
  if (/^(recebi|recebemos)\b/i.test(desc)) {
    return `. ${desc}`;
  }
  if (/^referente\b/i.test(desc)) {
    return `, ${desc.charAt(0).toLowerCase()}${desc.slice(1)}`;
  }
  return `, referente a ${desc}`;
};

const buildReceiptCopyHtml = (r: Receipt, copyLabel?: string): string => {
  const title = getReceiptTitleForNature(r.nature);
  const formattedVal = formatCurrencyBR(r.amount);
  const longDate = formatDateLongBR(r.receiptDate);
  const isTwoCopy = r.layoutMode === 'two-copy';

  const payerDocPart = r.payerDocument ? `, inscrito(a) no CPF/CNPJ sob o nº <strong>${escapeHtml(r.payerDocument)}</strong>` : '';
  const payerAddrPart = r.payerAddress ? `, residente/sediado(a) em ${escapeHtml(r.payerAddress)}` : '';

  const accountabilityTable = r.isAccountability
    ? `
      <table style="width:100%; border-collapse:collapse; margin:${isTwoCopy ? '7px 0' : '12px 0'}; font-size:${isTwoCopy ? '11.5px' : '13px'}; border:1px solid #cbd5e1;">
        <thead>
          <tr style="background:#f8fafc; border-bottom:1px solid #cbd5e1;">
            <th style="text-align:left; padding:4px 8px; color:#334155;">Discriminação da Prestação de Contas</th>
            <th style="text-align:right; padding:4px 8px; color:#334155;">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:3px 8px; color:#334155;">Valor Bruto Levantado (Alvará / RPV)</td>
            <td style="padding:3px 8px; text-align:right; font-weight:600;">${escapeHtml(formatCurrencyBR(r.grossAmount || 0))}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:3px 8px; color:#991b1b;">(-) Honorários Advocatícios / Retenções</td>
            <td style="padding:3px 8px; text-align:right; color:#991b1b; font-weight:600;">- ${escapeHtml(formatCurrencyBR(r.retainedFees || 0))}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:3px 8px; color:#334155;">(+) Reembolso de Custas / Despesas</td>
            <td style="padding:3px 8px; text-align:right; font-weight:600;">+ ${escapeHtml(formatCurrencyBR(r.reimbursedCosts || 0))}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:4px 8px; font-weight:700; color:#0f172a;">(=) Valor Líquido Repassado</td>
            <td style="padding:4px 8px; text-align:right; font-weight:800; color:#0f172a;">${escapeHtml(formattedVal)}</td>
          </tr>
        </tbody>
      </table>
    `
    : '';

  const notesHtml = r.notes
    ? `<div style="margin-top:${isTwoCopy ? '6px' : '10px'}; padding:5px 8px; background:#fffbeb; border-left:3px solid #d97706; font-size:${isTwoCopy ? '11px' : '12.5px'}; color:#451a03;"><strong>Observações:</strong> ${escapeHtml(r.notes)}</div>`
    : '';

  return `
    <div style="border:1.5px solid #1e293b; border-radius:6px; padding:${isTwoCopy ? '13px 18px' : '26px 30px'}; background:#ffffff; color:#0f172a; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between; height:${isTwoCopy ? '127mm' : '274mm'};">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #cbd5e1; padding-bottom:${isTwoCopy ? '9px' : '14px'}; margin-bottom:${isTwoCopy ? '12px' : '18px'};">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:${isTwoCopy ? '34px' : '44px'}; height:${isTwoCopy ? '34px' : '44px'}; border-radius:8px; background:#0f172a; color:#fbbf24; display:flex; align-items:center; justify-content:center;">
              <svg width="${isTwoCopy ? '19' : '25'}" height="${isTwoCopy ? '19' : '25'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
              </svg>
            </div>
            <div>
              ${copyLabel ? `<div style="font-size:10px; font-weight:700; letter-spacing:0.12em; color:#64748b; text-transform:uppercase;">${escapeHtml(copyLabel)}</div>` : ''}
              <div style="font-size:${isTwoCopy ? '15px' : '19px'}; font-weight:800; letter-spacing:0.04em; color:#0f172a;">${escapeHtml(title)}</div>
              <div style="font-size:${isTwoCopy ? '11.5px' : '13px'}; color:#475569; font-weight:600;">Recibo nº ${escapeHtml(r.receiptNumber)}</div>
            </div>
          </div>
          <div style="border:1.5px solid #0f172a; background:#f8fafc; border-radius:6px; padding:${isTwoCopy ? '5px 12px' : '8px 16px'}; text-align:right;">
            <div style="font-size:10px; font-weight:700; letter-spacing:0.08em; color:#475569; text-transform:uppercase;">Valor</div>
            <div style="font-size:${isTwoCopy ? '17px' : '22px'}; font-weight:800; color:#0f172a;">${escapeHtml(formattedVal)}</div>
          </div>
        </div>

        <p style="font-size:${isTwoCopy ? '13px' : '15px'}; line-height:${isTwoCopy ? '1.6' : '1.8'}; text-align:justify; margin:0 0 ${isTwoCopy ? '14px' : '18px'} 0; color:#1e293b;">
          Recebi(emos) de <strong>${escapeHtml(r.payerName || '_________________________')}</strong>${payerDocPart}${payerAddrPart}, a importância de <strong>${escapeHtml(formattedVal)}</strong> (<strong>${escapeHtml(r.amountInWords || 'zero real')}</strong>)${escapeHtml(formatDescriptionConnector(r.description))}
        </p>

        ${accountabilityTable}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:${isTwoCopy ? '6px 14px' : '10px 18px'}; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:${isTwoCopy ? '8px 12px' : '12px 16px'}; font-size:${isTwoCopy ? '11.5px' : '13px'}; color:#334155;">
          <div><strong>Forma de Pagamento:</strong> ${escapeHtml(r.paymentMethod)}${r.paymentDetails ? ` (${escapeHtml(r.paymentDetails)})` : ''}</div>
          <div><strong>Condição / Parcela:</strong> ${escapeHtml(r.condition || 'Quitação Integral')}</div>
          ${r.caseNumber ? `<div><strong>Processo nº:</strong> ${escapeHtml(r.caseNumber)}</div>` : '<div><strong>Natureza:</strong> ' + escapeHtml(r.nature) + '</div>'}
          ${r.court ? `<div><strong>Juízo / Vara:</strong> ${escapeHtml(r.court)}</div>` : `<div><strong>Comarca:</strong> ${escapeHtml(r.city)}</div>`}
        </div>

        ${notesHtml}
      </div>

      <div style="margin-top:${isTwoCopy ? '8px' : '20px'};">
        <div style="text-align:right; font-size:${isTwoCopy ? '12px' : '14px'}; color:#334155; margin-bottom:${isTwoCopy ? '16px' : '34px'};">
          ${escapeHtml(r.city)}, ${escapeHtml(longDate)}.
        </div>
        <div style="width:68%; margin:0 auto; text-align:center; border-top:1px solid #334155; padding-top:4px;">
          <div style="font-size:${isTwoCopy ? '12.5px' : '14px'}; font-weight:700; color:#0f172a;">${escapeHtml(r.emitterName)}</div>
          <div style="font-size:${isTwoCopy ? '11px' : '12.5px'}; color:#475569;">
            ${r.emitterOab ? escapeHtml(r.emitterOab) : ''}${r.emitterOab && r.emitterDocument ? ' • ' : ''}${r.emitterDocument ? `CPF/CNPJ: ${escapeHtml(r.emitterDocument)}` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
};

const printReceiptDocument = (r: Receipt) => {
  const isTwoCopy = r.layoutMode === 'two-copy';
  const bodyHtml = isTwoCopy
    ? `
      <div style="display:flex; flex-direction:column; justify-content:space-between; height:276mm;">
        ${buildReceiptCopyHtml(r, '1ª VIA — CLIENTE')}
        <div style="display:flex; align-items:center; gap:8px; margin:2mm 0; color:#64748b; font-size:10px;">
          <span style="font-size:13px;">&#9986;</span>
          <div style="flex:1; border-top:1.5px dashed #94a3b8;"></div>
          <span style="letter-spacing:0.12em; text-transform:uppercase; font-size:8.5px; font-weight:700;">Recorte aqui</span>
          <div style="flex:1; border-top:1.5px dashed #94a3b8;"></div>
        </div>
        ${buildReceiptCopyHtml(r, '2ª VIA — ESCRITÓRIO')}
      </div>
    `
    : buildReceiptCopyHtml(r);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Recibo ${escapeHtml(r.receiptNumber)}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Roboto, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            padding: 10mm;
          }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 150);
};

export const Receipts: React.FC = () => {
  const { receipts, addReceipt, updateReceipt, deleteReceipt, clients, cases, teamMembers, theme, addNotification } = useStore();

  const [activeTab, setActiveTab] = useState<'emitter' | 'history'>('emitter');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emitterDocCache, setEmitterDocCache] = useState<Record<string, string>>(() => loadEmitterDocCache());

  // Emitter profiles combining teamMembers + default profiles
  const emitterProfiles = useMemo(() => {
    const list: { id: string; name: string; oab: string; document: string }[] = [];
    const seen = new Set<string>();

    for (const def of DEFAULT_EMITTER_PROFILES) {
      const matched = teamMembers.find(m => normalizeText(m.name) === normalizeText(def.name));
      const key = normalizeText(def.name);
      seen.add(key);
      list.push({
        id: matched?.id || def.id,
        name: matched?.name || def.name,
        oab: matched?.oab ? formatOabLabel(matched.oab) : def.oab,
        document: emitterDocCache[key] || matched?.cpf || def.document,
      });
    }

    for (const m of teamMembers) {
      const key = normalizeText(m.name);
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: m.id,
          name: m.name,
          oab: m.oab ? formatOabLabel(m.oab) : 'Advogado(a)',
          document: emitterDocCache[key] || m.cpf || '',
        });
      }
    }

    return list;
  }, [teamMembers, emitterDocCache]);

  const defaultEmitterProfile = useMemo(
    () => emitterProfiles.find(p => normalizeText(p.name) === 'luiz geraldo motta') || emitterProfiles[0],
    [emitterProfiles]
  );

  const initialDate = getTodayLocal();
  const [receiptNumber, setReceiptNumber] = useState(() => getNextReceiptNumber(receipts, initialDate));
  const [receiptDate, setReceiptDate] = useState(initialDate);
  const [city, setCity] = useState('Resende - RJ');

  const [selectedEmitterId, setSelectedEmitterId] = useState(defaultEmitterProfile?.id || '');
  const [emitterName, setEmitterName] = useState(defaultEmitterProfile?.name || 'Luiz Geraldo Motta');
  const [emitterOab, setEmitterOab] = useState(defaultEmitterProfile?.oab || 'OAB/RJ nº 5.173-D');
  const [emitterDocument, setEmitterDocument] = useState(defaultEmitterProfile?.document || '');

  const [payerName, setPayerName] = useState('');
  const [payerDocument, setPayerDocument] = useState('');
  const [payerAddress, setPayerAddress] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  const [isAccountability, setIsAccountability] = useState(false);
  const [grossAmountStr, setGrossAmountStr] = useState('');
  const [retainedFeesStr, setRetainedFeesStr] = useState('');
  const [reimbursedCostsStr, setReimbursedCostsStr] = useState('');

  const [amountStr, setAmountStr] = useState('');
  const [amountInWords, setAmountInWords] = useState('zero real');
  const [wordsManuallyEdited, setWordsManuallyEdited] = useState(false);

  const [nature, setNature] = useState<string>(RECEIPT_NATURE_OPTIONS[0]);
  const [condition, setCondition] = useState<string>(RECEIPT_CONDITION_OPTIONS[0]);
  const [caseNumber, setCaseNumber] = useState('');
  const [showCaseSuggestions, setShowCaseSuggestions] = useState(false);
  const [court, setCourt] = useState('');
  const [description, setDescription] = useState(() => getDefaultDescriptionForNature(RECEIPT_NATURE_OPTIONS[0]));
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHOD_OPTIONS[0]);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [layoutMode, setLayoutMode] = useState<'two-copy' | 'one-copy'>('two-copy');

  const [historySearch, setHistorySearch] = useState('');

  const parseNum = (val: string): number => {
    const cleaned = val.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? Math.max(0, num) : 0;
  };

  // Auto-calculate net amount in Accountability Mode
  useEffect(() => {
    if (!isAccountability) return;
    const gross = parseNum(grossAmountStr);
    const retained = parseNum(retainedFeesStr);
    const costs = parseNum(reimbursedCostsStr);
    const net = Math.max(0, gross - retained + costs);
    const formatted = net > 0 ? net.toFixed(2).replace('.', ',') : '';
    setAmountStr(formatted);
    if (!wordsManuallyEdited) {
      setAmountInWords(valorPorExtenso(net));
    }
  }, [isAccountability, grossAmountStr, retainedFeesStr, reimbursedCostsStr, wordsManuallyEdited]);

  const numericAmount = useMemo(() => parseNum(amountStr), [amountStr]);

  const handleAmountChange = (val: string) => {
    setAmountStr(val);
    const parsed = parseNum(val);
    if (!wordsManuallyEdited) {
      setAmountInWords(valorPorExtenso(parsed));
    }
  };

  const handleEmitterSelect = (profileId: string) => {
    setSelectedEmitterId(profileId);
    const found = emitterProfiles.find(p => p.id === profileId);
    if (found) {
      setEmitterName(found.name);
      setEmitterOab(found.oab);
      setEmitterDocument(found.document);
    }
  };

  const handleEmitterDocChange = (val: string) => {
    const masked = formatCpfCnpj(val);
    setEmitterDocument(masked);
    const key = normalizeText(emitterName);
    if (key) {
      const next = { ...emitterDocCache, [key]: masked };
      setEmitterDocCache(next);
      saveEmitterDocCache(next);
    }
  };

  const handleNatureChange = (newNature: string) => {
    setNature(newNature);
    if (!descriptionManuallyEdited) {
      setDescription(getDefaultDescriptionForNature(newNature));
    }
    if (newNature === 'Prestação de Contas / Levantamento de Alvará ou RPV') {
      setIsAccountability(true);
    }
  };

  const buildClientAddress = (c: (typeof clients)[number]): string => {
    const streetPart = [c.street, c.addressNumber, c.complement].filter(Boolean).join(', ');
    const cityState = c.city && c.state ? `${c.city}/${c.state}` : (c.city || c.state || '');
    const regionPart = [c.neighborhood, cityState].filter(Boolean).join(' - ');
    const full = [streetPart, regionPart, c.zip ? `CEP ${c.zip}` : ''].filter(Boolean).join(', ');
    return full || c.address || '';
  };

  const applyClientData = (c: (typeof clients)[number]) => {
    setPayerName(c.name);
    setPayerDocument(c.document ? formatCpfCnpj(c.document) : '');
    setPayerAddress(buildClientAddress(c));
  };

  const filteredClients = useMemo(() => {
    if (!payerName.trim()) return [];
    const q = normalizeText(payerName);
    return clients
      .filter(c => normalizeText(c.name).includes(q) || (c.document && c.document.includes(payerName)))
      .slice(0, 6);
  }, [clients, payerName]);

  const filteredCases = useMemo(() => {
    if (!caseNumber.trim()) return [];
    const q = normalizeText(caseNumber);
    return cases
      .filter(c => normalizeText(c.number).includes(q) || normalizeText(c.clientName).includes(q))
      .slice(0, 6);
  }, [cases, caseNumber]);

  const currentReceipt: Receipt = {
    id: editingId || crypto.randomUUID(),
    receiptNumber: receiptNumber.trim() || getNextReceiptNumber(receipts, receiptDate),
    receiptDate,
    city: city.trim() || 'Resende - RJ',
    emitterName: emitterName.trim() || 'Advogado(a)',
    emitterOab: emitterOab.trim(),
    emitterDocument: emitterDocument.trim(),
    payerName: payerName.trim(),
    payerDocument: payerDocument.trim(),
    payerAddress: payerAddress.trim(),
    amount: numericAmount,
    amountInWords: amountInWords.trim() || valorPorExtenso(numericAmount),
    isAccountability,
    grossAmount: isAccountability ? parseNum(grossAmountStr) : undefined,
    retainedFees: isAccountability ? parseNum(retainedFeesStr) : undefined,
    reimbursedCosts: isAccountability ? parseNum(reimbursedCostsStr) : undefined,
    netAmount: isAccountability ? numericAmount : undefined,
    nature,
    condition: condition.trim(),
    caseNumber: caseNumber.trim(),
    court: court.trim(),
    description: description.trim(),
    paymentMethod,
    paymentDetails: paymentDetails.trim(),
    notes: notes.trim(),
    layoutMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleResetForm = () => {
    const today = getTodayLocal();
    setEditingId(null);
    setReceiptDate(today);
    setReceiptNumber(getNextReceiptNumber(receipts, today));
    if (defaultEmitterProfile) {
      setSelectedEmitterId(defaultEmitterProfile.id);
      setEmitterName(defaultEmitterProfile.name);
      setEmitterOab(defaultEmitterProfile.oab);
      setEmitterDocument(defaultEmitterProfile.document);
    }
    setPayerName('');
    setPayerDocument('');
    setPayerAddress('');
    setIsAccountability(false);
    setGrossAmountStr('');
    setRetainedFeesStr('');
    setReimbursedCostsStr('');
    setAmountStr('');
    setAmountInWords('zero real');
    setWordsManuallyEdited(false);
    setNature(RECEIPT_NATURE_OPTIONS[0]);
    setCondition(RECEIPT_CONDITION_OPTIONS[0]);
    setCaseNumber('');
    setCourt('');
    setDescription(getDefaultDescriptionForNature(RECEIPT_NATURE_OPTIONS[0]));
    setDescriptionManuallyEdited(false);
    setPaymentMethod(PAYMENT_METHOD_OPTIONS[0]);
    setPaymentDetails('');
    setNotes('');
  };

  const validateReceipt = (): boolean => {
    if (!payerName.trim()) {
      addNotification('Informe o Nome Completo / Razão Social do pagador.', 'warning');
      return false;
    }
    if (numericAmount <= 0) {
      addNotification('Informe um valor recebido maior que zero.', 'warning');
      return false;
    }
    if (!description.trim()) {
      addNotification('Informe a descrição do recibo ("Referente a").', 'warning');
      return false;
    }
    return true;
  };

  const handleSave = async (): Promise<Receipt | null> => {
    if (!validateReceipt()) return null;
    const toSave = { ...currentReceipt };
    if (editingId) {
      await updateReceipt(toSave);
    } else {
      await addReceipt(toSave);
      setEditingId(toSave.id);
    }
    return toSave;
  };

  const handleSaveAndPrint = async () => {
    const saved = await handleSave();
    if (saved) {
      printReceiptDocument(saved);
    }
  };

  const loadReceiptIntoForm = (r: Receipt, mode: 'edit' | 'duplicate') => {
    if (mode === 'edit') {
      setEditingId(r.id);
      setReceiptNumber(r.receiptNumber);
      setReceiptDate(r.receiptDate);
    } else {
      const today = getTodayLocal();
      setEditingId(null);
      setReceiptDate(today);
      setReceiptNumber(getNextReceiptNumber(receipts, today));
    }
    setCity(r.city || 'Resende - RJ');
    setEmitterName(r.emitterName);
    setEmitterOab(r.emitterOab || '');
    setEmitterDocument(r.emitterDocument || '');
    setPayerName(r.payerName);
    setPayerDocument(r.payerDocument || '');
    setPayerAddress(r.payerAddress || '');
    setIsAccountability(Boolean(r.isAccountability));
    setGrossAmountStr(r.grossAmount ? r.grossAmount.toFixed(2).replace('.', ',') : '');
    setRetainedFeesStr(r.retainedFees ? r.retainedFees.toFixed(2).replace('.', ',') : '');
    setReimbursedCostsStr(r.reimbursedCosts ? r.reimbursedCosts.toFixed(2).replace('.', ',') : '');
    setAmountStr(r.amount ? r.amount.toFixed(2).replace('.', ',') : '');
    setAmountInWords(r.amountInWords);
    setWordsManuallyEdited(true);
    setNature(r.nature);
    setCondition(r.condition || '');
    setCaseNumber(r.caseNumber || '');
    setCourt(r.court || '');
    setDescription(r.description);
    setDescriptionManuallyEdited(true);
    setPaymentMethod(r.paymentMethod);
    setPaymentDetails(r.paymentDetails || '');
    setNotes(r.notes || '');
    setLayoutMode(r.layoutMode || 'two-copy');
    setActiveTab('emitter');
  };

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return receipts;
    const q = normalizeText(historySearch);
    return receipts.filter(
      r =>
        normalizeText(r.payerName).includes(q) ||
        (r.payerDocument && r.payerDocument.includes(historySearch)) ||
        (r.caseNumber && r.caseNumber.includes(historySearch)) ||
        normalizeText(r.receiptNumber).includes(q)
    );
  }, [receipts, historySearch]);

  const isHybrid = theme === 'hybrid';
  const cardBg = isHybrid ? 'bg-[#2a3942] border-[#354751]' : 'bg-white border-slate-200';
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    isHybrid
      ? 'bg-[#202c33] border-[#354751] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884]'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'
  }`;
  const labelCls = `block text-xs font-semibold mb-1 ${isHybrid ? 'text-[#aebac1]' : 'text-slate-600'}`;

  const renderPreviewCopy = (copyLabel?: string) => {
    const r = currentReceipt;
    const isTwo = r.layoutMode === 'two-copy';
    return (
      <div className={`border-[1.5px] border-slate-800 rounded-md bg-white text-slate-900 flex flex-col justify-between ${isTwo ? 'p-3.5' : 'p-6 min-h-[540px]'}`}>
        <div>
          <div className={`flex justify-between items-center border-b border-slate-300 ${isTwo ? 'pb-2 mb-2.5' : 'pb-3 mb-4'}`}>
            <div className="flex items-center gap-2.5">
              <div className={`${isTwo ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0`}>
                <Scale size={isTwo ? 16 : 20} />
              </div>
              <div>
                {copyLabel && (
                  <div className="text-[9px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                    {copyLabel}
                  </div>
                )}
                <div className={`${isTwo ? 'text-xs' : 'text-sm'} font-extrabold tracking-wide text-slate-900`}>
                  {getReceiptTitleForNature(r.nature)}
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  Recibo nº {r.receiptNumber}
                </div>
              </div>
            </div>
            <div className="border-[1.5px] border-slate-900 bg-slate-50 rounded-md px-3 py-1 text-right shrink-0">
              <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Valor</div>
              <div className={`${isTwo ? 'text-sm' : 'text-base'} font-extrabold text-slate-900 tabular-nums`}>
                {formatCurrencyBR(r.amount)}
              </div>
            </div>
          </div>

          <p className={`${isTwo ? 'text-[11px] leading-relaxed mb-2' : 'text-[12.5px] leading-relaxed mb-3.5'} text-justify text-slate-800`}>
            Recebi(emos) de <strong>{r.payerName || '_________________________'}</strong>
            {r.payerDocument ? (
              <>
                , inscrito(a) no CPF/CNPJ sob o nº <strong>{r.payerDocument}</strong>
              </>
            ) : null}
            {r.payerAddress ? <>, residente/sediado(a) em {r.payerAddress}</> : null}, a importância de{' '}
            <strong>{formatCurrencyBR(r.amount)}</strong> (<strong>{r.amountInWords || 'zero real'}</strong>)
            {formatDescriptionConnector(r.description)}
          </p>

          {r.isAccountability && (
            <table className="w-full border-collapse border border-slate-300 text-[10.5px] mb-2.5">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300">
                  <th className="text-left px-2 py-1 text-slate-700">Prestação de Contas</th>
                  <th className="text-right px-2 py-1 text-slate-700">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="px-2 py-0.5 text-slate-700">Valor Bruto Levantado</td>
                  <td className="px-2 py-0.5 text-right font-semibold">{formatCurrencyBR(r.grossAmount || 0)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="px-2 py-0.5 text-rose-800">(-) Honorários / Retenções</td>
                  <td className="px-2 py-0.5 text-right font-semibold text-rose-800">- {formatCurrencyBR(r.retainedFees || 0)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="px-2 py-0.5 text-slate-700">(+) Reembolso de Custas</td>
                  <td className="px-2 py-0.5 text-right font-semibold">+ {formatCurrencyBR(r.reimbursedCosts || 0)}</td>
                </tr>
                <tr className="bg-slate-100">
                  <td className="px-2 py-1 font-bold text-slate-900">(=) Valor Líquido Repassado</td>
                  <td className="px-2 py-1 text-right font-extrabold text-slate-900">{formatCurrencyBR(r.amount)}</td>
                </tr>
              </tbody>
            </table>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-[10px] text-slate-700">
            <div>
              <strong>Pagamento:</strong> {r.paymentMethod}
              {r.paymentDetails ? ` (${r.paymentDetails})` : ''}
            </div>
            <div>
              <strong>Condição:</strong> {r.condition || 'Quitação Integral'}
            </div>
            {r.caseNumber ? (
              <div>
                <strong>Processo nº:</strong> {r.caseNumber}
              </div>
            ) : (
              <div>
                <strong>Natureza:</strong> {r.nature}
              </div>
            )}
            {r.court ? (
              <div>
                <strong>Juízo:</strong> {r.court}
              </div>
            ) : (
              <div>
                <strong>Comarca:</strong> {r.city}
              </div>
            )}
          </div>

          {r.notes && (
            <div className="mt-2 px-2.5 py-1 bg-amber-50 border-l-[3px] border-amber-600 text-[10px] text-amber-950">
              <strong>Observações:</strong> {r.notes}
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="text-right text-[10.5px] text-slate-700 mb-4">
            {r.city}, {formatDateLongBR(r.receiptDate)}.
          </div>
          <div className="w-2/3 mx-auto text-center border-t border-slate-700 pt-1">
            <div className="text-[11px] font-bold text-slate-900">{r.emitterName}</div>
            <div className="text-[9.5px] text-slate-600">
              {r.emitterOab}
              {r.emitterOab && r.emitterDocument ? ' • ' : ''}
              {r.emitterDocument ? `CPF/CNPJ: ${r.emitterDocument}` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-full flex flex-col pb-12 ${isHybrid ? 'bg-[#222e35]' : 'bg-slate-50'}`}>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-30 px-4 md:px-8 pt-4 pb-3 border-b shadow-sm ${
        isHybrid ? 'bg-[#202c33] border-emerald-500/20' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${isHybrid ? 'text-[#e9edef]' : 'text-slate-900'}`}>
              <ReceiptIcon size={22} className={isHybrid ? 'text-[#00a884]' : 'text-blue-600'} />
              Recibos Jurídicos
            </h1>
            <p className={`text-xs md:text-sm ${isHybrid ? 'text-[#aebac1]' : 'text-slate-500'}`}>
              Emissão profissional com preview A4 ao vivo e histórico sincronizado.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex p-1 rounded-xl border ${isHybrid ? 'bg-[#111b21] border-[#354751]' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setActiveTab('emitter')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'emitter'
                    ? (isHybrid ? 'bg-[#00a884] text-[#111b21]' : 'bg-white text-blue-700 shadow-sm')
                    : (isHybrid ? 'text-[#aebac1] hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Emitir Recibo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? (isHybrid ? 'bg-[#00a884] text-[#111b21]' : 'bg-white text-blue-700 shadow-sm')
                    : (isHybrid ? 'text-[#aebac1] hover:text-white' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Histórico
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isHybrid ? 'bg-[#2a3942] text-[#e9edef]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {receipts.length}
                </span>
              </button>
            </div>

            {activeTab === 'emitter' && (
              <button
                type="button"
                onClick={handleResetForm}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors ${
                  isHybrid ? 'border-[#354751] text-[#aebac1] hover:bg-[#2a3942]' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <RotateCcw size={14} /> Novo / Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'emitter' ? (
        <div className="p-4 md:px-8 pt-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Column: Form */}
          <div className="xl:col-span-6 space-y-4">
            {/* 1. Identificação */}
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isHybrid ? 'text-[#00a884]' : 'text-blue-700'}`}>
                <FileCheck size={15} /> 1. Identificação e Controle
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Nº do Recibo</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={e => setReceiptNumber(e.target.value)}
                    className={inputCls}
                    placeholder="001/2026"
                  />
                </div>
                <div>
                  <label className={labelCls}>Data do Recebimento</label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={e => setReceiptDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cidade / Comarca</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className={inputCls}
                    placeholder="Resende - RJ"
                  />
                </div>
              </div>
            </div>

            {/* 2. Emitente */}
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isHybrid ? 'text-[#00a884]' : 'text-blue-700'}`}>
                <User size={15} /> 2. Dados do Emitente (Advogado / Escritório)
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Seleção Rápida de Perfil</label>
                  <select
                    value={selectedEmitterId}
                    onChange={e => handleEmitterSelect(e.target.value)}
                    className={inputCls}
                  >
                    {emitterProfiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.oab}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className={labelCls}>Nome no Recibo</label>
                    <input
                      type="text"
                      value={emitterName}
                      onChange={e => setEmitterName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Inscrição OAB / Registro</label>
                    <input
                      type="text"
                      value={emitterOab}
                      onChange={e => setEmitterOab(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>CPF / CNPJ (Opcional)</label>
                    <input
                      type="text"
                      value={emitterDocument}
                      onChange={e => handleEmitterDocChange(e.target.value)}
                      className={inputCls}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Pagador */}
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isHybrid ? 'text-[#00a884]' : 'text-blue-700'}`}>
                <User size={15} /> 3. Dados do Pagador (Cliente)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 relative">
                  <label className={labelCls}>Nome Completo / Razão Social *</label>
                  <input
                    type="text"
                    value={payerName}
                    onFocus={() => setShowClientSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowClientSuggestions(false), 180)}
                    onChange={e => {
                      const val = e.target.value;
                      setPayerName(val);
                      setShowClientSuggestions(true);
                      const normalized = normalizeText(val);
                      if (normalized) {
                        const exact = clients.find(c => normalizeText(c.name) === normalized);
                        if (exact) {
                          if (exact.document) setPayerDocument(formatCpfCnpj(exact.document));
                          const addr = buildClientAddress(exact);
                          if (addr) setPayerAddress(addr);
                        }
                      }
                    }}
                    className={inputCls}
                    placeholder="Digite para buscar nos Contatos ou informe livremente..."
                  />
                  {showClientSuggestions && filteredClients.length > 0 && (
                    <div className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border shadow-lg max-h-48 overflow-y-auto ${
                      isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-white border-slate-200'
                    }`}>
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            applyClientData(c);
                            setShowClientSuggestions(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center border-b last:border-b-0 ${
                            isHybrid
                              ? 'border-[#354751] text-[#e9edef] hover:bg-[#2a3942]'
                              : 'border-slate-100 text-slate-800 hover:bg-blue-50'
                          }`}
                        >
                          <span className="font-semibold truncate">{c.name}</span>
                          <span className="text-[11px] opacity-70 ml-2 shrink-0">{c.document ? formatCpfCnpj(c.document) : c.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>CPF / CNPJ do Pagador</label>
                  <input
                    type="text"
                    value={payerDocument}
                    onChange={e => setPayerDocument(formatCpfCnpj(e.target.value))}
                    className={inputCls}
                    placeholder="000.000.000-00 ou CNPJ"
                  />
                </div>
                <div>
                  <label className={labelCls}>Endereço (Opcional)</label>
                  <input
                    type="text"
                    value={payerAddress}
                    onChange={e => setPayerAddress(e.target.value)}
                    className={inputCls}
                    placeholder="Rua, nº, Bairro, Cidade"
                  />
                </div>
              </div>
            </div>

            {/* 4. Valores e Prestação de Contas */}
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isHybrid ? 'text-[#00a884]' : 'text-blue-700'}`}>
                  <Calculator size={15} /> 4. Valores e Automação por Extenso
                </h2>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={isAccountability}
                    onChange={e => setIsAccountability(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={isHybrid ? 'text-[#e9edef]' : 'text-slate-700'}>
                    Modo Prestação de Contas / Alvará
                  </span>
                </label>
              </div>

              {isAccountability && (
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border mb-3 ${
                  isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-blue-50/60 border-blue-200'
                }`}>
                  <div>
                    <label className={labelCls}>Valor Bruto Levantado (R$)</label>
                    <input
                      type="text"
                      value={grossAmountStr}
                      onChange={e => setGrossAmountStr(e.target.value)}
                      className={inputCls}
                      placeholder="10000,00"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Honorários / Retenções (R$)</label>
                    <input
                      type="text"
                      value={retainedFeesStr}
                      onChange={e => setRetainedFeesStr(e.target.value)}
                      className={inputCls}
                      placeholder="3000,00"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Reembolso de Custas (R$)</label>
                    <input
                      type="text"
                      value={reimbursedCostsStr}
                      onChange={e => setReimbursedCostsStr(e.target.value)}
                      className={inputCls}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>
                    {isAccountability ? 'Valor Líquido Repassado (R$) *' : 'Valor Recebido (R$) *'}
                  </label>
                  <input
                    type="text"
                    value={amountStr}
                    onChange={e => handleAmountChange(e.target.value)}
                    className={`${inputCls} font-bold`}
                    placeholder="2500,00"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className={labelCls}>Valor por Extenso *</label>
                    {wordsManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setWordsManuallyEdited(false);
                          setAmountInWords(valorPorExtenso(numericAmount));
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:underline mb-1"
                      >
                        Regerar automático
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={amountInWords}
                    onChange={e => {
                      setWordsManuallyEdited(true);
                      setAmountInWords(e.target.value);
                    }}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* 5. Classificação Jurídica e Processo */}
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isHybrid ? 'text-[#00a884]' : 'text-blue-700'}`}>
                <Briefcase size={15} /> 5. Classificação Jurídica e Processo
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Natureza do Recebimento</label>
                  <select
                    value={nature}
                    onChange={e => handleNatureChange(e.target.value)}
                    className={inputCls}
                  >
                    {RECEIPT_NATURE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Condição / Parcela</label>
                  <input
                    type="text"
                    list="receipt-condition-options"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Parcela 1 de 3"
                  />
                  <datalist id="receipt-condition-options">
                    {RECEIPT_CONDITION_OPTIONS.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                <div className="relative">
                  <label className={labelCls}>Nº do Processo (Opcional)</label>
                  <input
                    type="text"
                    value={caseNumber}
                    onFocus={() => setShowCaseSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCaseSuggestions(false), 180)}
                    onChange={e => {
                      const raw = e.target.value;
                      setCaseNumber(/^\d[\d.-]*$/.test(raw) ? formatCNJ(raw) : raw);
                      setShowCaseSuggestions(true);
                    }}
                    className={inputCls}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                  {showCaseSuggestions && filteredCases.length > 0 && (
                    <div className={`absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border shadow-lg max-h-48 overflow-y-auto ${
                      isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-white border-slate-200'
                    }`}>
                      {filteredCases.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setCaseNumber(c.number);
                            if (c.court) setCourt(`${c.court}${c.city ? ` - ${c.city}/${c.uf}` : ''}`);
                            if (!payerName.trim() && c.clientName) setPayerName(c.clientName);
                            setShowCaseSuggestions(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs border-b last:border-b-0 ${
                            isHybrid
                              ? 'border-[#354751] text-[#e9edef] hover:bg-[#2a3942]'
                              : 'border-slate-100 text-slate-800 hover:bg-blue-50'
                          }`}
                        >
                          <div className="font-bold">{c.number}</div>
                          <div className="text-[11px] opacity-75 truncate">{c.clientName} — {c.court}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Juízo / Vara / Comarca (Opcional)</label>
                  <input
                    type="text"
                    value={court}
                    onChange={e => setCourt(e.target.value)}
                    className={inputCls}
                    placeholder="Ex: 1ª Vara Cível da Comarca de Resende/RJ"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className={labelCls}>Referente a (Descrição Detalhada) *</label>
                    {descriptionManuallyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setDescriptionManuallyEdited(false);
                          setDescription(getDefaultDescriptionForNature(nature));
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:underline mb-1"
                      >
                        Restaurar texto padrão
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => {
                      setDescriptionManuallyEdited(true);
                      setDescription(e.target.value);
                    }}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* 6. Forma de Pagamento */}
            <div className={`rounded-xl border p-4 shadow-sm ${cardBg}`}>
              <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isHybrid ? 'text-[#00a884]' : 'text-blue-700'}`}>
                6. Forma de Pagamento e Ressalvas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className={inputCls}
                  >
                    {PAYMENT_METHOD_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Instituição / Chave PIX / Comprovante</label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={e => setPaymentDetails(e.target.value)}
                    className={inputCls}
                    placeholder="Ex: Banco Itaú / Comprovante nº..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Observações / Ressalvas (Opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className={inputCls}
                    placeholder="Ex: No caso de pagamento em cheque, a quitação fica condicionada à compensação bancária."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live A4 Preview */}
          <div className="xl:col-span-6 xl:sticky xl:top-24 space-y-3">
            {/* Preview Toolbar */}
            <div className={`rounded-xl border p-3 shadow-sm flex flex-wrap items-center justify-between gap-2 ${cardBg}`}>
              <div className={`inline-flex p-1 rounded-lg border text-xs ${isHybrid ? 'bg-[#111b21] border-[#354751]' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setLayoutMode('two-copy')}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                    layoutMode === 'two-copy'
                      ? (isHybrid ? 'bg-[#00a884] text-[#111b21]' : 'bg-white text-slate-900 shadow-sm')
                      : (isHybrid ? 'text-[#aebac1]' : 'text-slate-600')
                  }`}
                >
                  2 Vias na Folha A4
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('one-copy')}
                  className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                    layoutMode === 'one-copy'
                      ? (isHybrid ? 'bg-[#00a884] text-[#111b21]' : 'bg-white text-slate-900 shadow-sm')
                      : (isHybrid ? 'text-[#aebac1]' : 'text-slate-600')
                  }`}
                >
                  1 Via (A4 Executivo)
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition-colors ${
                    isHybrid
                      ? 'border-[#354751] text-[#e9edef] hover:bg-[#354751]'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Save size={14} /> {editingId ? 'Atualizar' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => printReceiptDocument(currentReceipt)}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndPrint}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 size={14} /> Salvar e Imprimir
                </button>
              </div>
            </div>

            {/* A4 Sheet Preview */}
            <div className="bg-slate-200/70 rounded-xl p-3 md:p-4 border border-slate-300/80 shadow-inner">
              <div className="bg-white rounded-md shadow-md p-3 md:p-4 space-y-2">
                {layoutMode === 'two-copy' ? (
                  <>
                    {renderPreviewCopy('1ª VIA — CLIENTE')}
                    <div className="flex items-center gap-2 py-1 text-slate-400">
                      <Scissors size={14} />
                      <div className="flex-1 border-t border-dashed border-slate-400" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Recorte aqui</span>
                      <div className="flex-1 border-t border-dashed border-slate-400" />
                    </div>
                    {renderPreviewCopy('2ª VIA — ESCRITÓRIO')}
                  </>
                ) : (
                  renderPreviewCopy()
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="p-4 md:px-8 pt-5 max-w-6xl mx-auto w-full space-y-4">
          <div className={`rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 ${cardBg}`}>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Buscar por cliente, CPF/CNPJ, processo ou nº do recibo..."
                className={`${inputCls} pl-9`}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                handleResetForm();
                setActiveTab('emitter');
              }}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus size={15} /> Emitir Novo Recibo
            </button>
          </div>

          <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 px-4">
                <ReceiptIcon size={36} className="mx-auto text-slate-300 mb-2" />
                <p className={`text-sm font-medium ${isHybrid ? 'text-[#aebac1]' : 'text-slate-500'}`}>
                  Nenhum recibo encontrado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[11px] uppercase tracking-wider border-b ${
                      isHybrid ? 'bg-[#202c33] border-[#354751] text-[#aebac1]' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <th className="py-3 px-4 font-bold">Nº / Data</th>
                      <th className="py-3 px-4 font-bold">Pagador (Cliente)</th>
                      <th className="py-3 px-4 font-bold">Natureza / Processo</th>
                      <th className="py-3 px-4 font-bold text-right">Valor</th>
                      <th className="py-3 px-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-sm ${isHybrid ? 'divide-[#354751]' : 'divide-slate-100'}`}>
                    {filteredHistory.map(r => (
                      <tr key={r.id} className={isHybrid ? 'hover:bg-[#354751]/40' : 'hover:bg-slate-50'}>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className={`font-bold ${isHybrid ? 'text-[#e9edef]' : 'text-slate-900'}`}>{r.receiptNumber}</div>
                          <div className="text-xs text-slate-400">{r.receiptDate.split('-').reverse().join('/')}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-semibold ${isHybrid ? 'text-[#e9edef]' : 'text-slate-900'}`}>{r.payerName}</div>
                          {r.payerDocument && <div className="text-xs text-slate-400">{r.payerDocument}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`text-xs font-medium ${isHybrid ? 'text-[#d1d7db]' : 'text-slate-700'}`}>{r.nature}</div>
                          {r.caseNumber && <div className="text-[11px] text-slate-400">Proc: {r.caseNumber}</div>}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold tabular-nums">
                          <span className={isHybrid ? 'text-[#00a884]' : 'text-blue-700'}>
                            {formatCurrencyBR(r.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              title="Reimprimir"
                              onClick={() => printReceiptDocument(r)}
                              className={`p-1.5 rounded-lg transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#202c33] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              type="button"
                              title="Duplicar Recibo"
                              onClick={() => loadReceiptIntoForm(r, 'duplicate')}
                              className={`p-1.5 rounded-lg transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#202c33] hover:text-[#00a884]' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => loadReceiptIntoForm(r, 'edit')}
                              className={`p-1.5 rounded-lg transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#202c33] hover:text-amber-400' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'}`}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              title="Excluir"
                              onClick={() => {
                                if (window.confirm(`Excluir o recibo ${r.receiptNumber}?`)) {
                                  deleteReceipt(r.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#202c33] hover:text-rose-400' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

