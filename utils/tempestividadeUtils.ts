
import { Holiday } from '../types';
import { formatDate } from './dateUtils';

export type ActType =
    | 'contestação'
    | 'recurso'
    | 'embargos_declaracao'
    | 'contrarrazoes_recurso'
    | 'contrarrazoes_embargos'
    | 'manifestação'
    | 'outros';

export type Framework = 'CPC' | 'CLT' | 'JEC';

interface TemplateData {
    actType: ActType;
    framework: Framework;
    startDate: string; // Data de início da contagem
    notificationDate: string; // Data da publicação/notificação/juntada
    days: number;
    countType: 'business' | 'calendar';
    deadlineDate: string;
    holidays: Holiday[];
    reference?: string; // Ex: Index 1137, fls. 45
    customTitle?: string; // From the "Atividade" field
}

export const generateTempestividadeText = (data: TemplateData): string => {
    const { actType, framework, startDate, notificationDate, days, countType, deadlineDate, reference, customTitle } = data;

    const isTrabalhista = framework === 'CLT';
    const isJEC = framework === 'JEC';
    const isCPC = framework === 'CPC';

    const actName = getActName(actType);
    const displayActName = customTitle || actName;

    // Check if recesso is involved (Dec 20 - Jan 20)
    const hasRecesso = checkRecessoInvolved(notificationDate, deadlineDate);
    const suspensions = getSuspensionsSummary(notificationDate, deadlineDate, data.holidays);

    let text = `I. DA TEMPESTIVIDADE\n\n`;

    // Parágrafo 01: Notificação e Início
    const dayOfWeek = getDayOfWeek(notificationDate);
    const refText = reference ? ` (${reference})` : '';

    if (isCPC || isJEC) {
        if (actType === 'contestação') {
            text += `01.\tO mandado de citação devidamente cumprido${refText} foi juntado aos autos em ${formatDate(notificationDate)} (${dayOfWeek}), iniciando-se a fluência do prazo conforme o art. 335 do Código de Processo Civil para a apresentação da presente ${displayActName.toLowerCase()}.\n\n`;
        } else {
            const artRecurso = (actType === 'recurso' || actType === 'contrarrazoes_recurso') ? 'do art. 1.003, § 5º, do ' :
                (actType === 'embargos_declaracao' || actType === 'contrarrazoes_embargos') ? 'do art. 1.023 do ' : '';
            const frameworkName = isJEC ? 'Lei 9.099/95' : 'Código de Processo Civil';

            text += `01.\tA r. decisão${refText} foi publicada no Diário de Justiça Eletrônico em ${formatDate(notificationDate)} (${dayOfWeek}), iniciando-se a data de fluência do prazo ${artRecurso}${frameworkName} para a interposição de ${displayActName.toLowerCase()}.\n\n`;
        }
    } else if (isTrabalhista) {
        let laborArt = '';
        if (actType === 'contestação') laborArt = 'nos termos do art. 847, § 1º da CLT';
        else if (actType === 'recurso') laborArt = 'nos termos do art. 895 da CLT';
        else if (actType === 'embargos_declaracao') laborArt = 'nos termos do art. 897-A da CLT';
        else if (actType === 'contrarrazoes_recurso' || actType === 'contrarrazoes_embargos') laborArt = 'nos termos da legislação consolidada';
        else laborArt = 'nos termos da CLT';

        text += `01.\tCumpre demonstrar a tempestividade da presente ${displayActName.toLowerCase()}. A parte recebeu a notificação/intimação${refText} em ${formatDate(notificationDate)} (${dayOfWeek}). Nos termos da Súmula 16 do TST e art. 775 da CLT, a contagem inicia-se no primeiro dia útil subsequente, qual seja, ${formatDate(startDate)} (${getDayOfWeek(startDate)}), observando-se o prazo legal ${laborArt}.\n\n`;
    }

    // Parágrafo 02: Prazo e Regras de Contagem
    let ruleArt = '';
    if (isTrabalhista) {
        if (actType === 'embargos_declaracao' || actType === 'contrarrazoes_embargos') ruleArt = 'art. 897-A da CLT';
        else if (actType === 'recurso') ruleArt = 'art. 895 da CLT';
        else ruleArt = 'art. 775 da CLT';
    } else if (isJEC) {
        ruleArt = 'art. 12-A da Lei 9.099/95';
    } else if (actType === 'contestação') {
        ruleArt = 'art. 335 do CPC';
    } else if (actType === 'embargos_declaracao' || actType === 'contrarrazoes_embargos') {
        ruleArt = 'art. 1.023 do CPC';
    } else {
        ruleArt = 'artigos 219, 224 e 231 do CPC';
    }

    const dayType = countType === 'business' ? 'úteis' : 'corridos';

    text += `02.\tConsiderando que o prazo legal é de ${days} (${numberToWords(days)}) dias ${dayType}, conforme ${ruleArt}, e observando-se `;

    if (hasRecesso || suspensions.length > 0) {
        text += `a suspensão do prazo processual `;
        if (hasRecesso) {
            const recessoArt = isTrabalhista ? 'art. 775-A da CLT' : 'art. 220 do CPC';
            text += `em virtude do Recesso Forense (20/12 a 20/01), conforme ${recessoArt}, `;
            if (suspensions.length > 0) text += `além da suspensão `;
        }
        if (suspensions.length > 0) {
            text += `nos dias ${suspensions.join(', ')} `;
        }
        text += `segundo ainda as diretrizes legais, `;
    } else {
        text += `a contagem exclusiva em dias úteis, `;
    }

    text += `a presente manifestação é induvidosamente tempestiva.\n\n`;

    // Parágrafo 03: Conclusão
    text += `03.\tDesta forma, considerando a contagem legal, o prazo fatal para apresentação desta ${displayActName.toLowerCase()} encerra-se na data de ${formatDate(deadlineDate)}. Protocolada a presente peça nesta data, resta flagrante sua tempestividade.`;

    return text;
};

const getActName = (type: ActType): string => {
    switch (type) {
        case 'contestação': return 'Contestação';
        case 'recurso': return 'Recurso';
        case 'embargos_declaracao': return 'Embargos de Declaração';
        case 'contrarrazoes_recurso': return 'Contrarrazões';
        case 'contrarrazoes_embargos': return 'Contrarrazões aos Embargos';
        case 'manifestação': return 'Manifestação';
        default: return 'Peça Processual';
    }
};

const getDayOfWeek = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { weekday: 'long' });
};

const numberToWords = (n: number): string => {
    const words: { [key: number]: string } = {
        5: 'cinco', 8: 'oito', 10: 'dez', 15: 'quinze', 20: 'vinte', 30: 'trinta'
    };
    return words[n] || n.toString();
};

const checkRecessoInvolved = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    let cur = new Date(s);
    let count = 0;
    while (cur <= e && count < 1000) {
        count++;
        const month = cur.getUTCMonth() + 1;
        const day = cur.getUTCDate();
        if ((month === 12 && day >= 20) || (month === 1 && day <= 20)) return true;
        cur.setDate(cur.getDate() + 1);
    }
    return false;
};

const getSuspensionsSummary = (start: string, end: string, holidays: Holiday[]): string[] => {
    if (!start || !end) return [];
    const s = new Date(start);
    const e = new Date(end);
    const relevant: string[] = [];

    let cur = new Date(s);
    let count = 0;
    while (cur <= e && count < 1000) {
        count++;
        const dateStr = cur.toISOString().split('T')[0];
        const h = holidays.find(hol => hol.date === dateStr);
        if (h) {
            const month = cur.getUTCMonth() + 1;
            const day = cur.getUTCDate();
            const isRecesso = (month === 12 && day >= 20) || (month === 1 && day <= 20);

            if (!isRecesso) {
                relevant.push(`${formatDate(dateStr)} (${h.name})`);
            }
        }
        cur.setDate(cur.getDate() + 1);
    }
    return relevant;
};
