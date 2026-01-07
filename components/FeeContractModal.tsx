import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, DollarSign } from './Icons';
import { Client, TeamMember, Case } from '../types';

interface FeeContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    teamMembers: TeamMember[];
    cases?: Case[];
}

export const FeeContractModal: React.FC<FeeContractModalProps> = ({ isOpen, onClose, client, teamMembers, cases = [] }) => {
    // Basic State
    const [selectedLawyerIds, setSelectedLawyerIds] = useState<string[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [city, setCity] = useState<string>('Resende');
    const [ufLocation, setUfLocation] = useState<string>('RJ');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [generatedText, setGeneratedText] = useState('');

    // Contract Details State
    const [contractDetails, setContractDetails] = useState({
        serviceDescription: '',
        valueType: 'Fixed', // Fixed, Percentage, Mixed, Hourly
        value: '',
        percentage: '', // For success fee
        paymentMethod: 'Pix', // Pix, Transfer, Boleto, Cash
        installments: 1,
        dueDay: 5,
        bankDetails: '' // For transfer/pix
    });

    // Reset / Init
    useEffect(() => {
        if (isOpen && teamMembers.length > 0 && selectedLawyerIds.length === 0) {
            // Auto select first lawyer
            const first = teamMembers.find(m => m.oab || m.role === 'Advogado' || m.role === 'Sócio');
            if (first) setSelectedLawyerIds([first.id]);
        }
    }, [isOpen, teamMembers]);

    // Format helper for gender (Reused from PoA logic)
    const getGenderedTerm = (term: string, isFem: boolean) => {
        const lower = term.toLowerCase().trim();
        if (lower.includes('o(a)')) return isFem ? lower.replace(/o\(a\)/g, 'a') : lower.replace(/o\(a\)/g, 'o');
        if (lower.includes('(a)')) return isFem ? lower.replace(/\(a\)/g, 'a') : lower.replace(/\(a\)/g, '');

        const map: { [key: string]: string } = {
            'brasileiro': isFem ? 'brasileira' : 'brasileiro',
            'casado': isFem ? 'casada' : 'casado',
            'solteiro': isFem ? 'solteira' : 'solteiro',
            'viúvo': isFem ? 'viúva' : 'viúvo',
            'separado': isFem ? 'separada' : 'separado',
            'divorciado': isFem ? 'divorciada' : 'divorciado',
            'aposentado': isFem ? 'aposentada' : 'aposentado'
        };
        return map[lower] || lower;
    };

    // Text Generation Logic
    useEffect(() => {
        if (!client) return;

        // --- 1. PARTIES ---
        // Client (Contractor)
        let clientQual = '';
        const doc = client.document || '_______';
        const isBrazil = !client.country || client.country.toLowerCase() === 'brasil';
        const countryStr = isBrazil ? '' : `, ${client.country}`;
        const address = `${client.street || 'Rua...'}, nº ${client.addressNumber || 'S/N'}, ${client.complement ? client.complement + ', ' : ''}${client.neighborhood || 'Bairro...'}, ${client.city || 'Cidade'}, ${client.state || 'UF'}${countryStr}`;
        const zip = client.zip ? ` (CEP ${client.zip})` : '';

        if (client.type === 'Pessoa Jurídica') {
            clientQual = `${client.name.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${doc}, com sede na ${address}${zip}, neste ato representada por ${client.representative ? client.representative.toUpperCase() : '_______'}`;
        } else if (client.type === 'Espólio') {
            const nameClean = client.name.toUpperCase().replace('ESPÓLIO DE ', '').replace('ESPOLIO DE ', '');
            clientQual = `ESPÓLIO DE ${nameClean}, representado por seu inventariante ${client.representative ? client.representative.toUpperCase() : '_______'}`;
        } else {
            const isFem = client.gender === 'Feminino';
            const nat = client.nationality ? getGenderedTerm(client.nationality, isFem) : (isFem ? 'brasileira' : 'brasileiro');
            const mar = client.maritalStatus ? getGenderedTerm(client.maritalStatus, isFem) : (isFem ? 'solteira' : 'solteiro');
            const prof = client.profession ? getGenderedTerm(client.profession, isFem) : 'profissão...';
            clientQual = `${client.name.toUpperCase()}, ${nat}, ${mar}, ${prof}, inscrito(a) no CPF sob o nº ${doc}, residente e domiciliado(a) na ${address}${zip}`;
        }

        // Lawyers (Contracted)
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
                    const separator = idx === selectedLawyers.length - 1 ? '' : (idx === selectedLawyers.length - 2 ? ' e ' : ', ');

                    return `${l.name.toUpperCase()}, ${lNat}, ${lMar}, ${role} na OAB sob o nº ${lOab}${separator}`;
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
                    return `${l.name.toUpperCase()}, ${lNat}, ${lMar}, ${role} na OAB sob o nº ${lOab}, com escritório na ${lEnd}`;
                }).join(', e ');
            }
        }

        const contractedLabel = selectedLawyers.length > 1 ? 'os CONTRATADOS' : 'o CONTRATADO';

        // --- DYNAMIC CONTENT ---
        // CLAUSE 1: Object
        let objectText = contractDetails.serviceDescription || 'Patrocinar os interesses e direitos da CONTRATANTE na realização de...';

        // CLAUSE 6: Fees
        let feesText = '';
        if (contractDetails.valueType === 'Fixed') {
            feesText = `a importância líquida e certa de R$ ${contractDetails.value || '0,00'}`;
        } else if (contractDetails.valueType === 'Percentage') {
            feesText = `a importância equivalente a ${contractDetails.percentage || '0'}% (por cento) a incidir sobre o proveito econômico da causa`;
        } else {
            feesText = `a importância fixa de R$ ${contractDetails.value || '0,00'}, acrescida de ${contractDetails.percentage || '0'}% (por cento) ao final (Ad Exitum)`;
        }

        // Payment details to append to Clause 6
        let paymentCondition = '';
        if (contractDetails.valueType !== 'Percentage') {
            if (contractDetails.installments > 1) {
                paymentCondition = `, a ser pago parcelado em ${contractDetails.installments} vezes, com vencimento todo dia ${contractDetails.dueDay} de cada mês`;
            } else {
                paymentCondition = `, a ser pago à vista`;
            }
            if (contractDetails.paymentMethod === 'Pix') paymentCondition += ` via PIX (Chave: ${contractDetails.bankDetails})`;
            if (contractDetails.paymentMethod === 'Transfer') paymentCondition += ` via transferência (Dados: ${contractDetails.bankDetails})`;
        }

        // CLAUSE 12: Case Details
        let caseClause = `Declaram as partes que os trabalhos profissionais tiveram início nesta data.`;
        if (selectedCaseId) {
            const c = cases.find(x => x.id === selectedCaseId);
            if (c) {
                caseClause = `Declaram as partes que os trabalhos profissionais de que trata este instrumento se referem ao processo que tramita na ${c.court || '_______'} sob o nº ${c.number || '_______'}.`;
            }
        }

        // --- ASSEMBLY (14 Clauses) ---

        const header = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS\n\n`;

        const preamble = `Pelo presente instrumento particular de contrato de prestação de serviços profissionais da advocacia, ajustam as partes acima identificadas, de um lado como CONTRATANTE:\n${clientQual}\n\nE de outro lado como ${contractedLabel.toUpperCase()}:\n${lawyersText}\n\nO seguinte:\n\n`;

        const c1 = `01. ${contractedLabel.toUpperCase()} prestará à CONTRATANTE, sem qualquer vínculo empregatício, seus serviços profissionais especializados, para o fim de: ${objectText}.\n\n`;

        const c2 = `02. ${contractedLabel.toUpperCase()}, sob sua exclusiva responsabilidade, poderá delegar a profissionais, devidamente habilitados e que integram ou venham a integrar o quadro de seu escritório, sem que a eventual participação de outros profissionais, por escolha direta d${contractedLabel.toLowerCase()}, se constitua em oposição e/ou ampliação de qualquer direito em relação ao contrato ora ajustado.\n\n`;

        const c3 = `03. ${contractedLabel.toUpperCase()} prestará os serviços objeto deste instrumento, em qualquer Juízo, Instância ou Tribunal, atuando judicial e extrajudicialmente, na defesa dos interesses da CONTRATANTE decorrentes do objeto deste contrato.\n\n`;

        const c4 = `04. ${contractedLabel.toUpperCase()} se obriga a:\n   a) utilizar mão de obra habilitada e qualificada para a prestação dos serviços ora contratados;\n   b) arcar, integral e exclusivamente, com todos os ônus incidentes sobre a mão de obra utilizada na prestação dos serviços, mantendo a CONTRATANTE isenta de quaisquer ônus neste particular;\n   c) prestar todas as informações e/ou relatórios quanto ao andamento do processo e que lhe forem solicitadas pela CONTRATANTE.\n\n`;

        const c5 = `05. A CONTRATANTE se obriga a:\n   a) fornecer, em tempo hábil, todos os documentos e informações necessárias ou que vierem a ser requisitadas e/ou solicitadas p${contractedLabel.toLowerCase()} e que destinadas ao bom andamento do processo sob seu patrocínio;\n   b) reembolsar, de imediato e tão logo que solicitado p${contractedLabel.toLowerCase()}, todas as despesas judiciais e extrajudiciais que por ele despendidas em referido processo;\n   c) disponibilizar, quando solicitado, os valores necessários ao pagamento de impostos, taxas, emolumentos e despesas que se tornarem indispensáveis ao regular processamento do feito.\n\n`;

        const c6 = `06. A título de honorários advocatícios, a CONTRATANTE pagará ${selectedLawyers.length > 1 ? 'aos CONTRATADOS' : 'ao CONTRATADO'}, por força do presente contrato, ${feesText}${paymentCondition}.\n\n`;

        const c7 = `07. Ajustam ainda as partes que outras distintas ações e/ou procedimentos administrativos ou extrajudiciais, que envolvam seus direitos e obrigações relacionadas direta ou indiretamente com o objeto deste contrato serão patrocinadas p${contractedLabel.toLowerCase()}, ficando desde logo ajustado que, em tais circunstâncias, os honorários serão objeto de acerto em separado entre as partes e, por conseguinte, não se compreendendo no valor/percentual acima estabelecido.\n\n`;

        const c8 = `08. Estabelecem as partes que, em havendo êxito financeiro em referidas causas, os honorários de sucumbência serão pertencentes ${selectedLawyers.length > 1 ? 'aos CONTRATADOS' : 'ao CONTRATADO'}, independentemente dos honorários contratuais ajustados para cada caso e nunca superiores a 10% (dez por cento).\n\n`;

        const c9 = `09. Ajustam que em caso de renuncia ou revogação de mandato que importará na rescisão do presente contrato, qualquer que seja o motivo, os honorários serão devidos ${selectedLawyers.length > 1 ? 'aos CONTRATADOS' : 'ao CONTRATADO'} pelos serviços prestados.\n\n`;

        const c10 = `10. Todas as despesas suportadas p${contractedLabel.toLowerCase()} na prestação de serviços objeto do presente instrumento, notadamente custas processuais, extração de cópias, ligações telefônicas interurbanas, transmissões eletrônicas, serão reembolsadas pela CONTRATANTE, mediante apresentação dos respectivos comprovantes.\n\n`;

        const c11 = `11. O presente contrato vigorará pelo tempo necessário à conclusão do referido processo ou de outras ações que se seguirem, podendo ser denunciado a qualquer tempo, por qualquer das partes, mediante aviso por escrito, cabendo ${selectedLawyers.length > 1 ? 'aos CONTRATADOS' : 'ao CONTRATADO'} em qualquer hipótese o percebimento dos honorários pelos serviços efetivamente prestados até a data da denúncia e/ou revogação do mandato.\n\n`;

        const c12 = `12. ${caseClause}\n\n`;

        const c13 = `13. Elegem as partes o Foro da Comarca de ${city}/${ufLocation}, para dirimir controvérsias ou dúvidas oriundas do presente ajuste.\n\n`;

        const c14 = `14. As partes declaram ter pleno conhecimento do presente contrato e afirmam expressamente de que não tem qualquer dúvida quanto aos seus termos, condições e finalidades. E, por estarem, assim, de pleno acordo, firmam o presente contrato em duas (02) vias de igual teor e forma, com as testemunhas abaixo, rubricando as demais vias, para os devidos efeitos.`;

        const dateObj = new Date(date);
        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const dateExt = `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

        const footer = `\n\n${city}, ${dateExt}.\n\n_________________________________________\nCONTRATANTE: ${client.name.toUpperCase()}\n\n_________________________________________\n${contractedLabel.toUpperCase()}: ${selectedLawyers.map(l => l.name).join(' e ')}\n\n_________________________________________\nTestemunha 1\n\n_________________________________________\nTestemunha 2`;

        setGeneratedText(header + preamble + c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8 + c9 + c10 + c11 + c12 + c13 + c14 + footer);

    }, [client, selectedLawyerIds, selectedCaseId, city, ufLocation, date, contractDetails, teamMembers, cases]);

    const toggleLawyer = (id: string) => {
        setSelectedLawyerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    if (!isOpen || !client) return null;

    const copyToClipboard = () => navigator.clipboard.writeText(generatedText);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50 rounded-t-2xl">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-primary-600" /> Gerador de Contrato de Honorários
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Controls Sidebar */}
                    <div className="w-full lg:w-[450px] p-5 border-r border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-dark-900/30 font-sans">
                        <div className="space-y-6">

                            {/* Lawyers */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Advogados Contratados</label>
                                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-dark-800">
                                    {teamMembers.filter(m => m.oab || m.role === 'Advogado' || m.role === 'Sócio').map(m => (
                                        <label key={m.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-dark-700 rounded cursor-pointer">
                                            <input type="checkbox" checked={selectedLawyerIds.includes(m.id)} onChange={() => toggleLawyer(m.id)} className="accent-primary-600 rounded" />
                                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.name}</div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Case */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vincular Processo (Opcional)</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                    value={selectedCaseId} onChange={e => setSelectedCaseId(e.target.value)}>
                                    <option value="">Nenhum</option>
                                    {cases.map(c => <option key={c.id} value={c.id}>{c.number} - {c.title}</option>)}
                                </select>
                            </div>

                            {/* Service Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Objeto do Contrato</label>
                                <textarea className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm h-20 outline-none focus:border-primary-500"
                                    placeholder="Descrição dos serviços..." value={contractDetails.serviceDescription} onChange={e => setContractDetails({ ...contractDetails, serviceDescription: e.target.value })} />
                            </div>

                            {/* Financials */}
                            <div className="p-4 bg-white dark:bg-dark-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><DollarSign size={14} /> Honorários</h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                                        <select className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                            value={contractDetails.valueType} onChange={e => setContractDetails({ ...contractDetails, valueType: e.target.value })}>
                                            <option value="Fixed">Valor Fixo</option>
                                            <option value="Percentage">Percentual (Êxito)</option>
                                            <option value="Mixed">Misto (Fixo + %)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">{contractDetails.valueType === 'Percentage' ? '%' : 'Valor (R$)'}</label>
                                        <input className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                            value={contractDetails.valueType === 'Percentage' ? contractDetails.percentage : contractDetails.value}
                                            onChange={e => {
                                                if (contractDetails.valueType === 'Percentage') setContractDetails({ ...contractDetails, percentage: e.target.value });
                                                else setContractDetails({ ...contractDetails, value: e.target.value });
                                            }}
                                        />
                                    </div>
                                </div>

                                {contractDetails.valueType === 'Mixed' && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Percentual Adicional (%)</label>
                                        <input className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                            value={contractDetails.percentage} onChange={e => setContractDetails({ ...contractDetails, percentage: e.target.value })} />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Forma de Pagamento</label>
                                    <select className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                        value={contractDetails.paymentMethod} onChange={e => setContractDetails({ ...contractDetails, paymentMethod: e.target.value })}>
                                        <option value="Pix">Pix</option>
                                        <option value="Transfer">Transferência Bancária</option>
                                        <option value="Boleto">Boleto Bancário</option>
                                        <option value="Cash">Dinheiro / À Vista</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Parcelas</label>
                                        <input type="number" min="1" className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                            value={contractDetails.installments} onChange={e => setContractDetails({ ...contractDetails, installments: parseInt(e.target.value) || 1 })} />
                                    </div>
                                    {contractDetails.installments > 1 && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Dia Vencimento</label>
                                            <input type="number" min="1" max="31" className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                                value={contractDetails.dueDay} onChange={e => setContractDetails({ ...contractDetails, dueDay: parseInt(e.target.value) || 5 })} />
                                        </div>
                                    )}
                                </div>

                                {(contractDetails.paymentMethod === 'Pix' || contractDetails.paymentMethod === 'Transfer') && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Dados Bancários / Chave Pix</label>
                                        <input className="w-full p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                            value={contractDetails.bankDetails} onChange={e => setContractDetails({ ...contractDetails, bankDetails: e.target.value })} placeholder="Chave Pix ou Ag/Conta" />
                                    </div>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Local e Data</label>
                                <div className="flex gap-2">
                                    <input className="flex-1 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                        value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" />
                                    <input className="w-16 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm text-center"
                                        value={ufLocation} onChange={e => setUfLocation(e.target.value)} placeholder="UF" />
                                </div>
                                <input type="date" className="w-full mt-2 p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-dark-800 text-sm"
                                    value={date} onChange={e => setDate(e.target.value)} />
                            </div>

                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 p-6 flex flex-col bg-slate-200 dark:bg-black/20">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contrato Gerado</label>
                        <div className="flex-1 bg-white dark:bg-dark-800 shadow-sm rounded-lg border border-slate-300 dark:border-slate-700 relative overflow-hidden flex flex-col">
                            <textarea className="flex-1 w-full p-8 resize-none outline-none font-serif text-slate-800 dark:text-slate-200 leading-relaxed text-justify overflow-y-auto custom-scrollbar bg-transparent text-lg"
                                value={generatedText} onChange={e => setGeneratedText(e.target.value)} spellCheck={false} />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={copyToClipboard} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold shadow-lg hover:shadow-xl transform active:scale-95 transition-all text-sm">
                                <Copy size={18} /> Copiar Contrato
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
