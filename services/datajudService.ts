import { DataJudResponse } from '../types/datajud';

// Chave pública fornecida pelo CNJ (Wiki DataJud)
const DEFAULT_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

/**
 * Identifica o sufixo da API do tribunal com base nos dígitos J.TR do CNJ
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
const getTribunalSuffix = (processNumber: string): string => {
    const clean = processNumber.replace(/\D/g, '');
    if (clean.length !== 20) return 'tjrj';

    const j = clean.substring(13, 14); // Segmento J (Justiça)
    const tr = clean.substring(14, 16); // Segmento TR (Tribunal)

    // Tribunais Superiores (J=3)
    if (j === '3') return 'stj';

    // Justiça Federal (J=4)
    if (j === '4') {
        const trInt = parseInt(tr);
        return trInt > 0 ? `trf${trInt}` : 'trf1'; // Fallback for TRF
    }

    // Justiça do Trabalho (J=5)
    if (j === '5') {
        const trInt = parseInt(tr);
        return trInt === 0 ? 'tst' : `trt${trInt}`;
    }

    // Justiça Eleitoral (J=6)
    if (j === '6') {
        const trInt = parseInt(tr);
        return trInt === 0 ? 'tse' : `tre${trInt}`;
    }

    // Justiça Militar (J=7)
    if (j === '7') return 'stm';

    // Justiça Estadual (J=8)
    if (j === '8') {
        const stateMapping: Record<string, string> = {
            '01': 'tjac', '02': 'tjal', '03': 'tjam', '04': 'tjap', '05': 'tjba',
            '06': 'tjce', '07': 'tjdf', '08': 'tjes', '09': 'tjgo', '10': 'tjma',
            '11': 'tjmt', '12': 'tjms', '13': 'tjmg', '14': 'tjpa', '15': 'tjpb',
            '16': 'tjpr', '17': 'tjpe', '18': 'tjpi', '19': 'tjrj', '20': 'tjrn',
            '21': 'tjrs', '22': 'tjro', '23': 'tjrr', '24': 'tjsc', '25': 'tjse',
            '26': 'tjsp', '27': 'tjto'
        };
        return stateMapping[tr] || 'tjrj';
    }

    // Justiça Militar Estadual (J=9)
    if (j === '9') {
        const militaryMapping: Record<string, string> = {
            '13': 'tjmmg', '21': 'tjmrs', '26': 'tjmsp'
        };
        return militaryMapping[tr] || 'tjrj';
    }

    // Fallback para TJRJ
    return 'tjrj';
};

export const fetchProcessData = async (processNumber: string): Promise<DataJudResponse> => {
    const cleanNumber = processNumber.replace(/\D/g, '');
    const tribunalSuffix = getTribunalSuffix(cleanNumber);

    // A URL base é segmentada por tribunal na API pública
    const targetUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunalSuffix}/_search`;

    // Using corsproxy.io - try the direct path format
    const proxyUrl = `https://corsproxy.io/?${targetUrl}`;

    console.log(`Buscando processo ${cleanNumber} no tribunal ${tribunalSuffix}...`);

    const payload = {
        query: {
            match: {
                numeroProcesso: cleanNumber
            }
        }
    };

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `ApiKey ${DEFAULT_API_KEY}`,
                'X-API-Key': DEFAULT_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro na resposta da API (${response.status}):`, errorText);
            throw new Error(`Erro API DataJud (${response.status})`);
        }

        const data = await response.json();
        console.log("Resultado DataJud:", data);
        return data;
    } catch (error) {
        console.error("DataJud API Error:", error);
        throw error;
    }
};
