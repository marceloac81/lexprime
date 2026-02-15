import { Client } from '../types';

// Helper: Convert to Title Case
export const toTitleCase = (str: string) => {
    if (!str) return '';
    const prepositions = ['da', 'de', 'do', 'dos', 'das', 'e', 'em'];
    return str.toLowerCase().split(' ').map((word, index) => {
        if (index > 0 && prepositions.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

// Masks
export const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
export const maskCNPJ = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
export const removeMask = (value: string) => value.replace(/\D/g, '');

const parseImportDate = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return dateStr;
};

// Main Parsing Function
export const parseContactsCSV = (text: string): Client[] => {
    const rows = text.split('\n');
    if (rows.length < 2) return [];

    const headerRow = rows[0].toLowerCase();
    const isSemi = headerRow.includes(';');
    const separator = isSemi ? ';' : ',';

    // Normalize headers: remove quotes, trim, uppercase
    const headers = rows[0].split(separator).map(h => h.trim().toUpperCase().replace(/"/g, ''));

    const map: any = {};
    headers.forEach((h, i) => map[h] = i);

    const parsedClients: Client[] = [];

    for (let i = 1; i < rows.length; i++) {
        const rowStr = rows[i].trim();
        if (!rowStr) continue;

        // Split and handle potentially quoted values (basic handling)
        // Note: For complex CSVs with commas inside quotes, a robust parser logic is better, 
        // but sticking to split for now as per current simple implementation requirement.
        const cols = rowStr.split(separator).map(c => c.trim().replace(/"/g, ''));

        const rawName = cols[map['NOME']];
        if (rawName) {
            // 1. Capitalization
            const name = toTitleCase(rawName);

            // 2. Doc Sanitization
            const rawDoc = cols[map['CPF/CNPJ']] || '';
            const docNumbers = removeMask(rawDoc);

            // 3. Type Detection
            let type: 'Pessoa Física' | 'Pessoa Jurídica' | 'Espólio' = 'Pessoa Física';
            const nameUpper = name.toUpperCase();

            // Detect Espólio by Name first
            if (nameUpper.startsWith('ESPÓLIO') || nameUpper.startsWith('ESPOLIO')) {
                type = 'Espólio';
            }
            // Detect PJ by Document length (CNPJ is 14 digits)
            else if (docNumbers.length > 11) {
                type = 'Pessoa Jurídica';
            }
            // Fallback: If has Rep but 11 digits, could be Espólio or Minor, 
            // but sticking to standard rules: >11 PJ, Espólio keyword, else PF.
            // If the user explicitly wants to force Espólio without the name, they might need to update the CSV name or we'd need a specific TYPE column.

            // 4. Formatted Doc
            let formattedDoc = docNumbers;
            if (type === 'Pessoa Jurídica') formattedDoc = maskCNPJ(docNumbers);
            else if (docNumbers.length === 11) formattedDoc = maskCPF(docNumbers);
            // If Espólio often has no doc or uses deceased CPF, we store as is or masked if it fits.

            // 5. Representative Formatting
            const repNameRaw = cols[map['REPRESENTANTE']] || '';
            const repName = toTitleCase(repNameRaw);

            // 6. Map Fields
            const newClient: Client = {
                id: crypto.randomUUID(),
                name: name,
                document: formattedDoc,
                type: type,

                // --- PERSON FIELDS ---
                rg: cols[map['RG']] || '',
                birthDate: parseImportDate(cols[map['DATA_NASCIMENTO']] || ''),
                nationality: toTitleCase(cols[map['NACIONALIDADE']] || ''),
                maritalStatus: toTitleCase(cols[map['ESTADO_CIVIL']] || ''),
                profession: toTitleCase(cols[map['PROFISSAO']] || ''),
                gender: cols[map['GENERO']] as any, // Expecting Masculino/Feminino

                // --- CONTACT ---
                phone: cols[map['FONE_CEL']] || '',
                phoneHome: cols[map['FONE_CASA']] || '',
                phoneWork: cols[map['FONE_TRAB1']] || '',
                phoneWork2: cols[map['FONE_TRAB2']] || cols[map['FONE_TRAB_2']] || '',
                email: cols[map['E_MAIL']] || '',
                group: cols[map['GRUPO']] || '',

                // --- ADDRESS ---
                street: toTitleCase(cols[map['ENDERECO']] || ''),
                addressNumber: cols[map['NUMERO']] || '',
                complement: cols[map['COMPLEMENTO']] || '',
                neighborhood: toTitleCase(cols[map['BAIRRO']] || ''),
                city: toTitleCase(cols[map['CIDADE']] || ''),
                state: cols[map['ESTADO']] || '', // Usually UF, keep as is
                zip: cols[map['CEP']] || '',
                country: cols[map['PAIS']] || 'Brasil',

                // --- REPRESENTATIVE / PJ / ESPOLIO ---
                representative: repName,
                representativeQualification: cols[map['QUALIFICACAO_REP']] || '',
                // Removed specific Rep details as per user feedback - relying on full qualification string

                notes: cols[map['OBSERVACAO']] || '',
                createdAt: new Date().toISOString()
            };

            parsedClients.push(newClient);
        }
    }
    return parsedClients;
};

export const parseCasesCSV = (text: string): any[] => {
    const rows = text.split('\n');
    if (rows.length < 2) return [];

    const separator = rows[0].includes(';') ? ';' : ',';
    const headers = rows[0].split(separator).map(h => h.trim().toUpperCase().replace(/"/g, ''));
    const map: any = {};
    headers.forEach((h, i) => map[h] = i);

    const parsedCases: any[] = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(separator).map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2 || !cols[map['NUMERO']]) continue;

        parsedCases.push({
            id: crypto.randomUUID(),
            number: cols[map['NUMERO']],
            title: cols[map['TITULO']] || cols[map['NÚMERO']] || 'Importado',
            clientName: cols[map['CLIENTE']] || '',
            clientPosition: cols[map['POLO']] || 'Ativo',
            opposingParty: cols[map['PARTE_CONTRARIA']] || '',
            court: cols[map['LOCAL']] || '',
            uf: cols[map['UF']] || '',
            city: cols[map['CIDADE']] || '',
            area: cols[map['AREA']] || '',
            value: Number(cols[map['VALOR']]) || 0,
            status: (cols[map['STATUS']] || 'Ativo') as any,
            folderNumber: cols[map['PASTA']] || '',
            createdAt: new Date().toISOString()
        });
    }
    return parsedCases;
};

export const parseDeadlinesCSV = (text: string): any[] => {
    const rows = text.split('\n');
    if (rows.length < 2) return [];

    const separator = rows[0].includes(';') ? ';' : ',';
    const headers = rows[0].split(separator).map(h => h.trim().toUpperCase().replace(/"/g, ''));
    const map: any = {};
    headers.forEach((h, i) => map[h] = i);

    const parsedDeadlines: any[] = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(separator).map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2 || !cols[map['ATIVIDADE']]) continue;

        parsedDeadlines.push({
            id: crypto.randomUUID(),
            title: cols[map['ATIVIDADE']],
            dueDate: parseImportDate(cols[map['DATA']] || ''),
            startTime: cols[map['HORA']] || '09:00',
            caseTitle: cols[map['PROCESSO']] || '',
            customerName: cols[map['CLIENTE']] || '',
            status: cols[map['STATUS']] || 'Pending',
            isDone: cols[map['STATUS']] === 'Done',
        });
    }
    return parsedDeadlines;
};

export const parseTeamCSV = (text: string): any[] => {
    const rows = text.split('\n');
    if (rows.length < 2) return [];

    const separator = rows[0].includes(';') ? ';' : ',';
    const headers = rows[0].split(separator).map(h => h.trim().toUpperCase().replace(/"/g, ''));
    const map: any = {};
    headers.forEach((h, i) => map[h] = i);

    const parsedMembers: any[] = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        const cols = row.split(separator).map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 3 || !cols[map['EMAIL']]) continue;

        parsedMembers.push({
            id: crypto.randomUUID(),
            name: cols[map['NOME']],
            role: cols[map['CARGO']] || 'Membro',
            email: cols[map['EMAIL']],
            phone: cols[map['TELEFONE']] || '',
            oab: cols[map['OAB']] || '',
            cpf: cols[map['CPF']] || '',
            nationality: cols[map['NACIONALIDADE']] || '',
            maritalStatus: cols[map['ESTADO_CIVIL']] || '',
            gender: cols[map['GENERO']] as any,
            addressZip: cols[map['CEP']] || '',
            addressStreet: cols[map['RUA']] || '',
            addressNumber: cols[map['NUMERO']] || '',
            addressComplement: cols[map['COMPLEMENTO']] || '',
            addressNeighborhood: cols[map['BAIRRO']] || '',
            addressCity: cols[map['CIDADE']] || '',
            addressState: cols[map['ESTADO']] || '',
            active: true,
            createdAt: new Date().toISOString()
        });
    }
    return parsedMembers;
};

export const parseHolidaysCSV = (text: string): any[] => {
    const rows = text.split('\n');
    if (rows.length < 2) return [];

    const separator = rows[0].includes(';') ? ';' : ',';
    const headers = rows[0].split(separator).map(h => h.trim().toUpperCase().replace(/"/g, ''));
    const map: any = {};
    headers.forEach((h, i) => map[h] = i);

    const parsedHolidays: any[] = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        const cols = row.split(separator).map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2) continue;

        let dateStr = cols[map['DATA']] || '';
        // Handle DD/MM/YYYY
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        // Try multiple column name variations for the holiday name
        let holidayName = cols[map['NOME DO FERIADO']] ||
            cols[map['NOME']] ||
            cols[map['FERIADO']] ||
            cols[map['NOME_DO_FERIADO']] ||
            '';

        // Only use fallback if the name is truly empty
        if (!holidayName || holidayName.trim() === '') {
            holidayName = 'Feriado Importado';
        }

        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            parsedHolidays.push({
                id: crypto.randomUUID(),
                date: dateStr,
                name: holidayName.trim()
            });
        }
    }
    return parsedHolidays;
};

// --- EXPORT HELPERS ---

const formatDateForExport = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

export const generateContactsCSV = (clients: Client[]): string => {
    const headers = [
        'NOME', 'CPF/CNPJ', 'RG', 'DATA_NASCIMENTO', 'GENERO', 'NACIONALIDADE', 'ESTADO_CIVIL', 'PROFISSAO',
        'FONE_CEL', 'FONE_CASA', 'FONE_TRAB1', 'FONE_TRAB2', 'E_MAIL', 'GRUPO',
        'ENDERECO', 'NUMERO', 'COMPLEMENTO', 'BAIRRO', 'CIDADE', 'ESTADO', 'CEP', 'PAIS',
        'REPRESENTANTE', 'QUALIFICACAO_REP', 'OBSERVACAO'
    ];

    const rows = clients.map(c => {
        return [
            c.name,
            c.document, // Already formatted
            c.rg || '',
            formatDateForExport(c.birthDate || ''),
            c.gender || '',
            c.nationality || '',
            c.maritalStatus || '',
            c.profession || '',
            c.phone,
            c.phoneHome || '',
            c.phoneWork || '',
            c.phoneWork2 || '',
            c.email,
            c.group || '',
            c.street || '',
            c.addressNumber || '',
            c.complement || '',
            c.neighborhood || '',
            c.city || '',
            c.state || '',
            c.zip || '',
            c.country || '',
            c.representative || '',
            c.representativeQualification || '',
            c.notes || ''
        ].map(val => `"${val}"`).join(';'); // Use ; for Excel compatibility in BR
    });

    return [headers.join(';'), ...rows].join('\n');
};

// --- NEW EXPORT HELPERS ---

export const generateCasesCSV = (cases: any[]): string => {
    const headers = ['NUMERO', 'CLIENTE', 'POLO', 'PARTE_CONTRARIA', 'LOCAL', 'UF', 'CIDADE', 'AREA', 'VALOR', 'STATUS', 'PASTA'];
    const rows = cases.map(c => [
        c.number,
        c.clientName,
        c.clientPosition,
        c.opposingParty,
        c.court,
        c.uf,
        c.city,
        c.area,
        c.value || '',
        c.status,
        c.folderNumber || ''
    ]);
    return [headers.join(';'), ...rows.map(e => e.map(val => `"${val || ''}"`).join(';'))].join('\n');
};

export const generateDeadlinesCSV = (deadlines: any[], cases: any[]): string => {
    const headers = ['DATA', 'HORA', 'ATIVIDADE', 'PROCESSO', 'CLIENTE', 'VARA', 'CIDADE', 'UF', 'STATUS'];
    const rows = deadlines.map(d => {
        const relCase = cases.find(c => c.id === d.caseId);
        return [
            d.dueDate,
            d.startTime || '09:00',
            d.title,
            relCase?.number || '-',
            relCase?.clientName || d.customerName || '-',
            relCase?.court || d.court || '-',
            relCase?.city || d.city || '-',
            relCase?.uf || d.uf || '-',
            (d.status || (d.isDone ? 'Done' : 'Pending'))
        ];
    });
    return [headers.join(';'), ...rows.map(e => e.map(val => `"${val || ''}"`).join(';'))].join('\n');
};

export const generateTeamCSV = (members: any[]): string => {
    const headers = [
        'NOME', 'CARGO', 'EMAIL', 'TELEFONE', 'OAB', 'CPF', 'NACIONALIDADE', 'ESTADO_CIVIL', 'GENERO',
        'CEP', 'RUA', 'NUMERO', 'COMPLEMENTO', 'BAIRRO', 'CIDADE', 'ESTADO'
    ];
    const rows = members.map(m => [
        m.name, m.role, m.email, m.phone, m.oab || '', m.cpf || '',
        m.nationality || '', m.maritalStatus || '', m.gender || '',
        m.addressZip || '', m.addressStreet || '', m.addressNumber || '', m.addressComplement || '',
        m.addressNeighborhood || '', m.addressCity || '', m.addressState || ''
    ]);
    return [headers.join(';'), ...rows.map(e => e.map(val => `"${val || ''}"`).join(';'))].join('\n');
};

export const generateHolidaysCSV = (holidays: any[]): string => {
    const headers = ['DATA', 'NOME'];
    const rows = holidays.map(h => [h.date, h.name]);
    return [headers.join(';'), ...rows.map(e => e.map(val => `"${val || ''}"`).join(';'))].join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
    // Add BOM for Excel UTF-8 recognition
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
