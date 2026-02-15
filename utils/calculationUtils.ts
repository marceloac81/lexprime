export interface UfirPeriod {
    year: number;
    monthStart: number;
    monthEnd: number;
    value: number;
}

// Tabela UFIR/RJ 1995-2026
// Fonte: TJRJ / SEFAZ
export const UFIR_TABLE: UfirPeriod[] = [
    { year: 1995, monthStart: 1, monthEnd: 3, value: 0.6767 },
    { year: 1995, monthStart: 4, monthEnd: 6, value: 0.7061 },
    { year: 1995, monthStart: 7, monthEnd: 9, value: 0.7564 },
    { year: 1995, monthStart: 10, monthEnd: 12, value: 0.7952 },
    { year: 1996, monthStart: 1, monthEnd: 6, value: 0.8287 },
    { year: 1996, monthStart: 7, monthEnd: 12, value: 0.8847 },
    { year: 1997, monthStart: 1, monthEnd: 12, value: 0.9108 },
    { year: 1998, monthStart: 1, monthEnd: 12, value: 0.9611 },
    { year: 1999, monthStart: 1, monthEnd: 12, value: 0.9770 },
    { year: 2000, monthStart: 1, monthEnd: 12, value: 1.0641 },
    { year: 2001, monthStart: 1, monthEnd: 12, value: 1.1283 },
    { year: 2002, monthStart: 1, monthEnd: 12, value: 1.2130 },
    { year: 2003, monthStart: 1, monthEnd: 12, value: 1.3584 },
    { year: 2004, monthStart: 1, monthEnd: 12, value: 1.4924 },
    { year: 2005, monthStart: 1, monthEnd: 12, value: 1.6049 },
    { year: 2006, monthStart: 1, monthEnd: 12, value: 1.6992 },
    { year: 2007, monthStart: 1, monthEnd: 12, value: 1.7495 },
    { year: 2008, monthStart: 1, monthEnd: 12, value: 1.8258 },
    { year: 2009, monthStart: 1, monthEnd: 12, value: 1.9372 },
    { year: 2010, monthStart: 1, monthEnd: 12, value: 2.0183 },
    { year: 2011, monthStart: 1, monthEnd: 12, value: 2.1352 },
    { year: 2012, monthStart: 1, monthEnd: 12, value: 2.2752 },
    { year: 2013, monthStart: 1, monthEnd: 12, value: 2.4066 },
    { year: 2014, monthStart: 1, monthEnd: 12, value: 2.5473 },
    { year: 2015, monthStart: 1, monthEnd: 12, value: 2.7119 },
    { year: 2016, monthStart: 1, monthEnd: 12, value: 3.0023 },
    { year: 2017, monthStart: 1, monthEnd: 12, value: 3.1999 },
    { year: 2018, monthStart: 1, monthEnd: 12, value: 3.2939 },
    { year: 2019, monthStart: 1, monthEnd: 12, value: 3.4211 },
    { year: 2020, monthStart: 1, monthEnd: 12, value: 3.5550 },
    { year: 2021, monthStart: 1, monthEnd: 12, value: 3.7053 },
    { year: 2022, monthStart: 1, monthEnd: 12, value: 4.0915 },
    { year: 2023, monthStart: 1, monthEnd: 12, value: 4.3329 },
    { year: 2024, monthStart: 1, monthEnd: 12, value: 4.5373 },
    { year: 2025, monthStart: 1, monthEnd: 12, value: 4.7508 },
    { year: 2026, monthStart: 1, monthEnd: 12, value: 4.9604 },
];

/**
 * Obtém o valor da UFIR para uma determinada data
 */
export const getUfirValue = (date: Date): number | null => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const period = UFIR_TABLE.find(p =>
        p.year === year &&
        month >= p.monthStart &&
        month <= p.monthEnd
    );

    return period ? period.value : null;
};

/**
 * Calcula a diferença de dias entre duas datas (Comercial 360 dias)
 * Cada mês tem 30 dias.
 */
export const getDaysDiff360 = (startDate: Date, endDate: Date): number => {
    const d1 = startDate.getDate();
    const m1 = startDate.getMonth() + 1;
    const y1 = startDate.getFullYear();

    const d2 = endDate.getDate();
    const m2 = endDate.getMonth() + 1;
    const y2 = endDate.getFullYear();

    // Cálculo bancário/judicial 360d
    const days = Math.max(0, (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1));
    return days;
};

/**
 * Calcula juros simples pro-rata
 */
export const calculateInterest = (
    value: number,
    annualRate: number,
    days: number
): number => {
    if (annualRate === 0) return 0;
    // Taxa diária baseada em 360 dias
    const dailyRate = annualRate / 100 / 360;
    return value * dailyRate * days;
};
