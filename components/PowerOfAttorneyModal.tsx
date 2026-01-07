import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, User } from './Icons';
import { Client, TeamMember, Case } from '../types';

interface PowerOfAttorneyModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    teamMembers: TeamMember[];
    cases?: Case[]; // Optional for now until passed
}

export const PowerOfAttorneyModal: React.FC<PowerOfAttorneyModalProps> = ({ isOpen, onClose, client, teamMembers, cases = [] }) => {
    // Basic State
    const [selectedLawyerIds, setSelectedLawyerIds] = useState<string[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [city, setCity] = useState<string>('Resende');
    const [ufLocation, setUfLocation] = useState<string>('RJ');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [generatedText, setGeneratedText] = useState('');

    // Powers State
    const [powers, setPowers] = useState({
        general: true,
        adJudicia: true,
        extrajudicial: true,
        labor: false,
        inventory: false,
        criminal: false,
        specific: ''
    });

    // Reset / Init
    useEffect(() => {
        if (isOpen && teamMembers.length > 0 && selectedLawyerIds.length === 0) {
            // Auto select first lawyer
            const first = teamMembers.find(m => m.oab || m.role === 'Advogado' || m.role === 'Sócio');
            if (first) setSelectedLawyerIds([first.id]);
        }
    }, [isOpen, teamMembers]);

    // Format helper for gender
    // Format helper for gender
    const getGenderedTerm = (term: string, isFem: boolean) => {
        const lower = term.toLowerCase().trim();

        // 1. Check for specific "o(a)" pattern first (e.g. Brasileiro(a))
        if (lower.includes('o(a)')) {
            return isFem ? lower.replace(/o\(a\)/g, 'a') : lower.replace(/o\(a\)/g, 'o');
        }

        // 2. Check for "(a)" pattern (e.g. Portador(a))
        if (lower.includes('(a)')) {
            return isFem ? lower.replace(/\(a\)/g, 'a') : lower.replace(/\(a\)/g, '');
        }

        // 3. Common complete words
        const map: { [key: string]: string } = {
            'brasileiro': isFem ? 'brasileira' : 'brasileiro',
            'casado': isFem ? 'casada' : 'casado',
            'solteiro': isFem ? 'solteira' : 'solteiro',
            'viúvo': isFem ? 'viúva' : 'viúvo',
            'separado': isFem ? 'separada' : 'separado',
            'divorciado': isFem ? 'divorciada' : 'divorciado',
            'aposentado': isFem ? 'aposentada' : 'aposentado'
        };

        if (map[lower]) return map[lower];

        return lower;
    };

    // Text Generation Logic
    useEffect(() => {
        if (!client) return;

        // --- 1. CLIENT (Grantor) ---
        let clientQual = '';
        const doc = client.document || '_______';

        // Determine if country should be shown (if not Brasil)
        const isBrazil = !client.country || client.country.toLowerCase() === 'brasil';
        const countryStr = isBrazil ? '' : `, ${client.country}`;
        const zipLabel = isBrazil ? 'CEP' : 'Código Postal';

        const address = `${client.street || 'Rua...'}, nº ${client.addressNumber || 'S/N'}, ${client.complement ? client.complement + ', ' : ''}${client.neighborhood || 'Bairro...'}, ${client.city || 'Cidade'}, ${client.state || 'UF'}${countryStr}`;
        const zip = client.zip ? ` (${zipLabel} ${client.zip})` : '';
        const email = client.email ? `, endereço eletrônico ${client.email}` : '';

        if (client.type === 'Pessoa Jurídica') {
            // PJ Logic from Clients.tsx
            // NAME, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº DOC, com sede na ADDRESS, neste ato representada por REP, QUAL_REP.
            clientQual = `${client.name.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${doc}, com sede na ${address}${zip}, neste ato representada por ${client.representative ? client.representative.toUpperCase() : '_______'}, ${client.representativeQualification ? client.representativeQualification : 'qualificação...'}${email}`;

        } else if (client.type === 'Espólio') {
            // Espólio Logic form Clients.tsx
            // ESPÓLIO DE NAME, entidade sem personalidade jurídica, neste ato representado por REP, QUAL_REP.
            const nameClean = client.name.toUpperCase().replace('ESPÓLIO DE ', '').replace('ESPOLIO DE ', '');
            clientQual = `ESPÓLIO DE ${nameClean}, entidade sem personalidade jurídica, neste ato representado por seu inventariante ${client.representative ? client.representative.toUpperCase() : '_______'}, ${client.representativeQualification ? client.representativeQualification : 'qualificação...'}${email}`;

        } else {
            // PF Logic from Clients.tsx
            const isFem = client.gender === 'Feminino';

            // Format Date
            let birth = client.birthDate;
            if (birth) {
                const parts = birth.split('-'); // YYYY-MM-DD
                if (parts.length === 3) birth = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            const nat = client.nationality ? getGenderedTerm(client.nationality, isFem) : (isFem ? 'brasileira' : 'brasileiro');
            const mar = client.maritalStatus ? getGenderedTerm(client.maritalStatus, isFem) : (isFem ? 'solteira' : 'solteiro');
            const prof = client.profession ? getGenderedTerm(client.profession, isFem) : 'profissão...';

            const bornStr = isFem ? 'nascida' : 'nascido';
            const portadorStr = isFem ? 'portadora' : 'portador';
            const inscritoStr = isFem ? 'inscrita' : 'inscrito';
            const residenteStr = isFem ? 'residente e domiciliada' : 'residente e domiciliado';

            clientQual = `${client.name.toUpperCase()}, ${nat}, ${mar}, ${prof}, ${birth ? `${bornStr} em ${birth}, ` : ''}${client.rg ? `${portadorStr} da carteira de identidade nº ${client.rg}, ` : ''}${inscritoStr} no CPF sob o nº ${doc}, ${residenteStr} na ${address}${zip}${email}`;

            // Add Representative info if exists (Minors/Incapable)
            if (client.representative) {
                clientQual += `, neste ato ${isFem ? 'representada' : 'representado'} por ${client.representative.toUpperCase()}${client.representativeQualification ? `, ${client.representativeQualification}` : ''}`;
            }
        }

        // --- 2. LAWYERS (Grantees) ---
        const selectedLawyers = teamMembers
            .filter(m => selectedLawyerIds.includes(m.id))
            .sort((a, b) => {
                const oabA = parseInt(a.oab?.replace(/\D/g, '') || '999999');
                const oabB = parseInt(b.oab?.replace(/\D/g, '') || '999999');
                return oabA - oabB;
            });

        let lawyersText = '_______________________________________';

        if (selectedLawyers.length > 0) {
            // Check if all share the same address
            const getAddrKey = (l: TeamMember) => `${l.addressStreet || ''}|${l.addressNumber || ''}|${l.addressCity || ''}|${l.addressState || ''}`;
            const firstAddrKey = getAddrKey(selectedLawyers[0]);
            const allSameAddress = selectedLawyers.length > 1 && selectedLawyers.every(l => getAddrKey(l) === firstAddrKey && l.addressStreet);

            if (allSameAddress) {
                const l0 = selectedLawyers[0];
                const sharedAddr = `${l0.addressStreet}, nº ${l0.addressNumber || 'S/N'}, ${l0.addressCity || ''}-${l0.addressState || ''}`;

                lawyersText = selectedLawyers.map((l, idx) => {
                    const isFem = l.gender === 'Feminino';
                    const lNat = l.nationality ? getGenderedTerm(l.nationality, isFem) : (isFem ? 'brasileira' : 'brasileiro');
                    const lMar = l.maritalStatus ? getGenderedTerm(l.maritalStatus, isFem) : (isFem ? 'solteira' : 'solteiro');
                    const lOab = l.oab || '_______';
                    const role = isFem ? 'advogada inscrita' : 'advogado inscrito';
                    const emailTxt = l.email ? `, email: ${l.email}` : '';

                    const separator = idx === selectedLawyers.length - 1 ? '' : (idx === selectedLawyers.length - 2 ? ' e ' : ', ');
                    return `${l.name}, ${lNat}, ${lMar}, ${role} na OAB sob o nº ${lOab}${emailTxt}${separator}`;
                }).join('');

                lawyersText += `, todos com endereço profissional na ${sharedAddr}`;
            } else {
                lawyersText = selectedLawyers.map(l => {
                    const isFem = l.gender === 'Feminino';
                    const lNat = l.nationality ? getGenderedTerm(l.nationality, isFem) : (isFem ? 'brasileira' : 'brasileiro');
                    const lMar = l.maritalStatus ? getGenderedTerm(l.maritalStatus, isFem) : (isFem ? 'solteira' : 'solteiro');
                    const lOab = l.oab || '_______';
                    const lEnd = l.addressStreet ? `${l.addressStreet}, ${l.addressNumber || ''}, ${l.addressCity || ''}-${l.addressState || ''}` : 'endereço profissional...';
                    const role = isFem ? 'advogada inscrita' : 'advogado inscrito';
                    const emailTxt = l.email ? `, email: ${l.email}` : '';

                    return `${l.name}, ${lNat}, ${lMar}, ${role} na OAB sob o nº ${lOab}, com endereço profissional na ${lEnd}${emailTxt}`;
                }).join(', e ');
            }
        }

        // Verb appointment - Lowercase "nomeia e constitui"
        // "NOMEIA E CONSTITUI" (Singular) as requested
        let proxyTerm = 'seu bastante procurador';
        const rightsOwner = selectedLawyers.length > 1 ? 'os mesmos' : 'dito procurador';

        if (selectedLawyers.length > 1) {
            proxyTerm = 'seus bastantes procuradores';
        } else if (selectedLawyers.length === 1) {
            const isFem = selectedLawyers[0].gender === 'Feminino';
            proxyTerm = isFem ? 'sua bastante procuradora' : 'seu bastante procurador';
        }

        const verbPhrase = `nomeia e constitui ${proxyTerm}`;

        // --- 3. POWERS ---
        const isClientFem = client.gender === 'Feminino';
        let powersText = `aos quais outorga poderes gerais para o foro (cláusula ad judicia) para que, em qualquer Juízo ou Tribunal, promova a defesa dos direitos, interesses e obrigações ${isClientFem ? 'da outorgante' : 'do outorgante'}`;

        // Case Link
        if (selectedCaseId) {
            const c = cases.find(x => x.id === selectedCaseId);
            if (c) {
                // "processo nº X que tramita na Vara Y da Comarca de Cidade/UF"
                const location = c.city && c.uf ? ` da Comarca de ${c.city}/${c.uf}` : '';
                const courtInfo = c.court ? ` que tramita na ${c.court}${location}` : '';
                powersText += `, especialmente para atuar nos autos do processo nº ${c.number}${courtInfo}`;
            }
        }

        const extraList = [];
        const represent = isClientFem ? 'representá-la' : 'representá-lo';

        if (powers.extrajudicial) extraList.push(`podendo ${represent} perante repartições públicas e órgãos da administração direta e indireta`);
        if (powers.labor) extraList.push('propor Reclamação Trabalhista, comparecer a audiências, prestar depoimento pessoal');

        if (powers.inventory) {
            extraList.push('atuar em processo de Inventário/Arrolamento, podendo prestar primeiras e últimas declarações, concordar e discordar de cálculos, requerer alvarás, assinar termos de inventariante');
        }
        if (powers.criminal) {
            extraList.push('atuar na esfera Criminal, podendo representar em audiência preliminar, oferecer queixa-crime, requerer liberdade provisória, impetrar Habeas Corpus');
        }

        if (extraList.length > 0) {
            powersText += ', bem como ' + extraList.join(', ');
        }

        powersText += `, especialmente para promover as medidas necessárias, podendo ${rightsOwner}, para tanto, renunciar ao direito que se funda a ação, transigir, desistir, firmar termos e compromissos, formalizar acordo, receber e dar quitação em juízo, recorrer ordinária e extraordinariamente, praticar todos os atos necessários ao fiel cumprimento do presente mandato e podendo, ainda, substabelecer.`;

        if (powers.specific) {
            powersText += ` PODERES ESPECÍFICOS: ${powers.specific}`;
        }

        // --- 4. DATE/LOCAL ---
        const dateObj = new Date(date);
        const day = dateObj.getDate();
        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        const fullLocation = `${city}${ufLocation ? `, ${ufLocation}` : ''}`;
        const dateExt = `${day} de ${month} de ${year}`;

        // FINAL ASSEMBLY - STRICT SINGLE PARAGRAPH
        // No newlines (\n) except for title and signature area.
        const header = `PROCURAÇÃO AD JUDICIA E EXTRAJUDICIAL\n\n`;
        const body = `Pelo presente instrumento particular de procuração, ${clientQual}, ${verbPhrase}: ${lawyersText}, ${powersText}`;
        const footer = `\n\n${fullLocation}, ${dateExt}.\n\n_________________________________________\n${client.name.toUpperCase()}`;

        setGeneratedText(header + body + footer);
    }, [client, selectedLawyerIds, selectedCaseId, city, ufLocation, date, powers, teamMembers, cases]);

    // Handle multi-select
    const toggleLawyer = (id: string) => {
        setSelectedLawyerIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    if (!isOpen || !client) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedText);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-primary-600" /> Gerador de Procuração
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Controls Sidebar */}
                    <div className="w-full lg:w-96 p-5 border-r border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-dark-900/30 font-sans">
                        <div className="space-y-6">

                            {/* 1. Lawyers */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Outorgados (Advogados)</label>
                                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-dark-800">
                                    {teamMembers.filter(m => m.oab || m.role === 'Advogado' || m.role === 'Sócio').map(m => (
                                        <label key={m.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-dark-700 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedLawyerIds.includes(m.id)}
                                                onChange={() => toggleLawyer(m.id)}
                                                className="accent-primary-600 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.name}</div>
                                                <div className="text-xs text-slate-500">{m.oab ? `OAB ${m.oab}` : m.role}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Case Linking */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vincular a Processo (Opcional)</label>
                                <select
                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                    value={selectedCaseId}
                                    onChange={e => setSelectedCaseId(e.target.value)}
                                >
                                    <option value="">Geral (Sem processo específico)</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id}>{c.number} - {c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Powers */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Poderes</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-700">
                                        <input type="checkbox" checked={powers.general} disabled className="accent-primary-600" />
                                        Gerais (Ad Judicia)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-700">
                                        <input type="checkbox" checked={powers.extrajudicial} onChange={e => setPowers({ ...powers, extrajudicial: e.target.checked })} className="accent-primary-600" />
                                        Extrajudiciais (Repartições Públicas)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-700">
                                        <input type="checkbox" checked={powers.labor} onChange={e => setPowers({ ...powers, labor: e.target.checked })} className="accent-primary-600" />
                                        Trabalhistas (Reclamação, Audiências)
                                    </label>

                                    <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-700">
                                        <input type="checkbox" checked={powers.inventory} onChange={e => setPowers({ ...powers, inventory: e.target.checked })} className="accent-amber-600" />
                                        Inventário / Sucessões
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-700">
                                        <input type="checkbox" checked={powers.criminal} onChange={e => setPowers({ ...powers, criminal: e.target.checked })} className="accent-rose-600" />
                                        Criminal (Queixa-Crime, HC...)
                                    </label>

                                    <div className="pt-2">
                                        <span className="text-xs text-slate-500 block mb-1">Outros Poderes Específicos</span>
                                        <textarea
                                            className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-xs h-16 outline-none focus:border-primary-500"
                                            placeholder="Ex: vender imóvel matrícula X..."
                                            value={powers.specific}
                                            onChange={e => setPowers({ ...powers, specific: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Location */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Local e Data</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        placeholder="Cidade"
                                    />
                                    <input
                                        className="w-16 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm text-center"
                                        value={ufLocation}
                                        onChange={e => setUfLocation(e.target.value)}
                                        placeholder="UF"
                                    />
                                </div>
                                <input
                                    type="date"
                                    className="w-full mt-2 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 p-6 flex flex-col bg-slate-200 dark:bg-black/20">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visualização em Tempo Real</label>
                        <div className="flex-1 bg-white dark:bg-dark-800 shadow-sm rounded-lg border border-slate-300 dark:border-slate-700 relative overflow-hidden flex flex-col">
                            <textarea
                                className="flex-1 w-full p-8 resize-none outline-none font-serif text-slate-800 dark:text-slate-200 leading-relaxed text-justify overflow-y-auto custom-scrollbar bg-transparent text-lg"
                                value={generatedText}
                                onChange={e => setGeneratedText(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        <div className="mt-4 flex gap-3 justify-end items-center">
                            <span className="text-xs text-slate-500 italic mr-auto">Edite o texto diretamente se necessário.</span>
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold shadow-lg hover:shadow-xl transform active:scale-95 transition-all text-sm"
                            >
                                <Copy size={18} /> Copiar para Área de Transferência
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
