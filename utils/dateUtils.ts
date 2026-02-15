
import { Holiday } from '../types';

// Static holidays (Brazil 2024/2025) - Exported to serve as default
export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: '2024-01-01', name: 'Confraternização Universal' },
  { date: '2024-02-12', name: 'Carnaval' },
  { date: '2024-02-13', name: 'Carnaval' },
  { date: '2024-03-29', name: 'Paixão de Cristo' },
  { date: '2024-04-21', name: 'Tiradentes' },
  { date: '2024-05-01', name: 'Dia do Trabalho' },
  { date: '2024-05-30', name: 'Corpus Christi' },
  { date: '2024-09-07', name: 'Independência do Brasil' },
  { date: '2024-10-12', name: 'Nossa Senhora Aparecida' },
  { date: '2024-11-02', name: 'Finados' },
  { date: '2024-11-15', name: 'Proclamação da República' },
  { date: '2024-11-20', name: 'Dia da Consciência Negra' },
  { date: '2024-12-25', name: 'Natal' },
  // 2025
  { date: '2025-01-01', name: 'Confraternização Universal' },
];

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return 'Data Inválida';

  // Fix timezone offset issue for display by using UTC methods if string is YYYY-MM-DD
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  try {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (e) {
    return 'Data Inválida';
  }
};

export const isWeekend = (date: Date): boolean => {
  if (isNaN(date.getTime())) return false;
  const day = date.getUTCDay(); // Use UTC to avoid timezone shifts on simple dates
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

// Modified to accept custom holidays list
export const isHoliday = (date: Date, customHolidays: Holiday[] = DEFAULT_HOLIDAYS): string | null => {
  if (isNaN(date.getTime())) return null;
  const dateString = date.toISOString().split('T')[0];

  // REMOVED HARDCODED RECESSO FORENSE LOGIC
  // The user wants strict adherence to the holiday list. 
  // If Recesso applies, it must be present in the customHolidays array.

  const holiday = customHolidays.find(h => h.date === dateString);
  return holiday ? holiday.name : null;
};

// Helper to get day name
const getDayName = (date: Date): string => {
  // Use UTC to avoid timezone shift (e.g. 2026-01-24 UTC midnight is Friday 21:00 in Brazil)
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(date);
};

// Modified to accept custom holidays list
export const calculateDeadline = (
  startDateStr: string,
  days: number,
  type: 'business' | 'calendar',
  customHolidays: Holiday[] = DEFAULT_HOLIDAYS
): { date: Date, logs: string[], simulation: import('../types').SimulationStep[] } => {

  // Allow 0 days, check for NaN only
  if (!startDateStr || isNaN(days)) {
    return { date: new Date(), logs: ['Aguardando dados válidos...'], simulation: [] };
  }

  const parts = startDateStr.split('-');
  if (parts.length !== 3) {
    return { date: new Date(), logs: ['Formato de data inválido'], simulation: [] };
  }

  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return { date: new Date(), logs: ['Data inválida'], simulation: [] };
  }

  let current = new Date(Date.UTC(y, m - 1, d));

  if (isNaN(current.getTime())) {
    return { date: new Date(), logs: ['Data inválida'], simulation: [] };
  }

  const formattedStart = formatDate(startDateStr);
  const startDayName = getDayName(current);
  const logs: string[] = [`Data de publicação/intimação: ${formattedStart} (${startDayName})`];
  const simulation: import('../types').SimulationStep[] = [];

  // Day 0: Start Day (Excluded)
  simulation.push({
    date: formattedStart,
    label: 'Dia do começo',
    isCounted: false,
    reason: 'start'
  });

  // If 0 days, return immediately without CPC rule
  if (days === 0) {
    logs.push('Prazo de 0 dias: A data final é igual à data inicial.');
    return { date: current, logs, simulation };
  }

  // CPC Rule: Exclude start day (Day 0)
  logs.push(`Dia de início (excluído): ${formattedStart} (${startDayName})`);
  current.setDate(current.getDate() + 1);

  let count = 0;

  if (type === 'business') {
    while (count < days) {
      const dateStr = current.toISOString().split('T')[0];
      const formattedDate = formatDate(dateStr);
      const dayName = getDayName(current);
      const holidayName = isHoliday(current, customHolidays);
      const weekend = isWeekend(current);

      if (holidayName) {
        logs.push(`${formattedDate} (${dayName}): Feriado (${holidayName}) - Não contado`);
        simulation.push({ date: formattedDate, label: holidayName, isCounted: false, reason: 'holiday' });
      } else if (weekend) {
        logs.push(`${formattedDate} (${dayName}): Final de semana - Não contado`);
        simulation.push({ date: formattedDate, label: 'Final de Semana', isCounted: false, reason: 'weekend' });
      } else {
        count++;
        logs.push(`${formattedDate} (${dayName}): Dia útil ${count}/${days}`);
        simulation.push({ date: formattedDate, label: dayName, isCounted: true, count, reason: 'business' });
      }

      // Move to next day if we haven't finished counting
      if (count < days) {
        current.setDate(current.getDate() + 1);
      }
    }
  } else {
    // Calendar days
    for (let i = 0; i < days; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const formattedDate = formatDate(dateStr);
      const dayName = getDayName(current);

      count++;
      logs.push(`${formattedDate} (${dayName}): Dia corrido ${count}/${days}`);
      simulation.push({ date: formattedDate, label: dayName, isCounted: true, count, reason: 'calendar' });

      if (count < days) current.setDate(current.getDate() + 1);
    }
  }

  // Prorrogation logic (if ends on non-business day)
  let extensionNeeded = true;
  let safeCounter = 0;
  while (extensionNeeded && safeCounter < 365) {
    safeCounter++;
    const dateStr = current.toISOString().split('T')[0];
    const formattedDate = formatDate(dateStr);
    const dayName = getDayName(current);
    const holidayName = isHoliday(current, customHolidays);
    const weekend = isWeekend(current);

    if (holidayName || weekend) {
      logs.push(`${formattedDate} (${dayName}) Vencimento em dia não útil (${holidayName || 'Fim de semana'}). Prorrogando para o próximo dia útil...`);
      simulation.push({
        date: formattedDate,
        label: holidayName || 'Final de Semana',
        isCounted: false,
        reason: holidayName ? 'holiday' : 'weekend'
      });
      current.setDate(current.getDate() + 1);
    } else {
      extensionNeeded = false;
    }
  }

  const finalDateStr = current.toISOString().split('T')[0];
  const finalDayName = getDayName(current);
  logs.push(`Vencimento final: ${formatDate(finalDateStr)} (${finalDayName})`);

  return { date: current, logs, simulation };
};

export const getBusinessDaysDiff = (start: Date, end: Date, customHolidays: Holiday[] = DEFAULT_HOLIDAYS): number => {
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  let count = 0;
  let cur = new Date(start);
  while (cur < end) {
    const day = cur.getDay();
    const holiday = isHoliday(cur, customHolidays);
    if (day !== 0 && day !== 6 && !holiday) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};
