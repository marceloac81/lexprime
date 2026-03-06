
import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen } from 'lucide-react';

interface CpcPrazo {
    artigo: string;
    prazo: string;
    dias: number;
    acao: string;
}

interface CpcReferenceCatalogProps {
    onClose: () => void;
    onSelect: (dias: number, descricao: string) => void;
}

const CPC_PRAZOS: CpcPrazo[] = [
    { artigo: "98, §8º", prazo: "15 dias", dias: 15, acao: "Manifestação sobre revogação total ou parcial da gratuidade ou sua substituição por parcelamento" },
    { artigo: "100", prazo: "15 dias", dias: 15, acao: "Impugnação à concessão da justiça gratuita" },
    { artigo: "101, §2º", prazo: "5 dias", dias: 5, acao: "Recolhimento das custas processuais após denegação ou revogação da gratuidade" },
    { artigo: "104, §1º", prazo: "15 dias", dias: 15, acao: "Exibição de procuração pelo advogado (prorrogável por igual período)" },
    { artigo: "106, §1º", prazo: "5 dias", dias: 5, acao: "Suprir omissão das informações previstas no inciso I" },
    { artigo: "107", prazo: "5 dias", dias: 5, acao: "Requerer, como procurador, vista dos autos de qualquer processo" },
    { artigo: "111, § único", prazo: "15 dias", dias: 15, acao: "Constituir novo advogado devido à revogação do procurador anterior" },
    { artigo: "112, §1º", prazo: "10 dias", dias: 10, acao: "Período em que o advogado deve continuar representando o mandante após sua renúncia" },
    { artigo: "120", prazo: "15 dias", dias: 15, acao: "Impugnação à assistência de terceiro juridicamente interessado" },
    { artigo: "131", prazo: "30 dias", dias: 30, acao: "Promoção da citação daqueles que devem figurar em litisconsórcio passivo" },
    { artigo: "135", prazo: "15 dias", dias: 15, acao: "Manifestação e requerimento das provas cabíveis em incidente de desconsideração da personalidade jurídica" },
    { artigo: "138", prazo: "15 dias", dias: 15, acao: "Solicitação ou admissão de amicus curiae" },
    { artigo: "143, § único", prazo: "10 dias", dias: 10, acao: "Apreciação de providência e requerimento pelo juiz" },
    { artigo: "146", prazo: "15 dias", dias: 15, acao: "Alegação de impedimento ou suspeição" },
    { artigo: "146, §1º", prazo: "15 dias", dias: 15, acao: "Apresentação das razões do juiz em caso de impedimento ou suspeição" },
    { artigo: "148, §2º", prazo: "15 dias", dias: 15, acao: "Oitiva do arguido no incidente de impedimento ou suspeição" },
    { artigo: "153, §4º", prazo: "2 dias", dias: 2, acao: "Prestação de informações por parte do servidor, em casos em que a parte se considera preterida na ordem cronológica" },
    { artigo: "154, § único", prazo: "5 dias", dias: 5, acao: "Manifestação da parte contrária na proposta de autocomposição" },
    { artigo: "157, §1º", prazo: "15 dias", dias: 15, acao: "Período em que o perito pode apresentar escusa do encargo alegando motivo legítimo" },
    { artigo: "178", prazo: "30 dias", dias: 30, acao: "Intervenção do Ministério Público como fiscal da ordem jurídica nas hipóteses previstas" },
    { artigo: "218, §3º", prazo: "5 dias", dias: 5, acao: "Prática de ato processual em caso de inexistência de preceito legal ou prazo determinado pelo juiz" },
    { artigo: "226, I", prazo: "5 dias", dias: 5, acao: "Proferimento de despachos" },
    { artigo: "226, II", prazo: "10 dias", dias: 10, acao: "Proferimento de decisões interlocutórias" },
    { artigo: "226, III", prazo: "30 dias", dias: 30, acao: "Proferimento de sentenças" },
    { artigo: "228", prazo: "1 dia", dias: 1, acao: "Remessa dos autos conclusos pelo serventuário" },
    { artigo: "228", prazo: "5 dias", dias: 5, acao: "Execução de atos processuais pelo serventuário" },
    { artigo: "234, §2º", prazo: "3 dias", dias: 3, acao: "Devolução de autos após a intimação" },
    { artigo: "235, §1º", prazo: "15 dias", dias: 15, acao: "Apresentação de justificativa por juiz ou relator, em casos de não observância dos prazos previstos em lei" },
    { artigo: "235, §2º", prazo: "10 dias", dias: 10, acao: "Período para a prática do ato pelo representado (juiz ou relator)" },
    { artigo: "235, §3º", prazo: "10 dias", dias: 10, acao: "Remessa dos autos ao substituto legal do juiz ou do relator se mantida a inércia" },
    { artigo: "240, §2º", prazo: "10 dias", dias: 10, acao: "Adoção das providências necessárias para viabilizar a citação" },
    { artigo: "244, II", prazo: "7 dias", dias: 7, acao: "Impossibilidade de citação após a data do óbito (salvo para evitar o perecimento do direito)" },
    { artigo: "244, III", prazo: "3 dias", dias: 3, acao: "Impossibilidade de citação após a data das núpcias (salvo para evitar o perecimento do direito)" },
    { artigo: "245, §2º", prazo: "5 dias", dias: 5, acao: "Apresentação do laudo de examinação do citando por médico" },
    { artigo: "254", prazo: "10 dias", dias: 10, acao: "Envio de carta, telegrama ou email dando ciência, feita citação com hora certa" },
    { artigo: "257, III", prazo: "20–60 dias", dias: 20, acao: "Determinação do prazo na citação por edital" },
    { artigo: "268", prazo: "10 dias", dias: 10, acao: "Devolução, após cumprimento, da carta de ordem, precatória e rogatória ao juízo de origem" },
    { artigo: "290", prazo: "15 dias", dias: 15, acao: "Pagamento das custas e despesas de ingresso" },
    { artigo: "302, II", prazo: "5 dias", dias: 5, acao: "Fornecer os meios necessários para citação do requerido após obtenção da tutela em caráter antecedente" },
    { artigo: "303, §1º, I", prazo: "15 dias", dias: 15, acao: "Aditamento da petição inicial, com a complementação da argumentação, de novos documentos e da confirmação do pedido de tutela final" },
    { artigo: "303, §6º", prazo: "5 dias", dias: 5, acao: "Emenda da petição inicial se não houver elementos para concessão da tutela antecipada" },
    { artigo: "306", prazo: "5 dias", dias: 5, acao: "Contestação do pedido e indicação das provas que pretende produzir, em procedimento de tutela cautelar requerida em caráter antecedente" },
    { artigo: "307", prazo: "5 dias", dias: 5, acao: "Decisão do juiz quando não for contestado o pedido" },
    { artigo: "308", prazo: "30 dias", dias: 30, acao: "Formulação do pedido principal quando efetivada a tutela cautelar" },
    { artigo: "309, II", prazo: "30 dias", dias: 30, acao: "Efetivação da tutela concedida em caráter antecedente" },
    { artigo: "313, §3º", prazo: "15 dias", dias: 15, acao: "Constituição de novo procurador na hipótese de morte deste" },
    { artigo: "313, §6º", prazo: "30 dias", dias: 30, acao: "Período de suspensão do processo no casos do art. 313, IX" },
    { artigo: "313, §7º", prazo: "8 dias", dias: 8, acao: "Período de suspensão do processo no casos do art. 313, X" },
    { artigo: "321", prazo: "15 dias", dias: 15, acao: "Emenda da petição inicial" },
    { artigo: "329, II", prazo: "15 dias", dias: 15, acao: "Manifestação quanto aditamento ou alteração do pedido, antes do saneamento do processo" },
    { artigo: "331", prazo: "5 dias", dias: 5, acao: "Retratação do juiz quando indeferir a petição inicial" },
    { artigo: "332, §3º", prazo: "5 dias", dias: 5, acao: "Retratação do juiz quando interposta a apelação, ao julgar liminarmente improcedente o pedido" },
    { artigo: "332, §4º", prazo: "15 dias", dias: 15, acao: "Citação do réu para apresentar contrarrazões quando não houver retratação" },
    { artigo: "334", prazo: "30 dias", dias: 30, acao: "Prazo mínimo para designar a data de audiência de conciliação ou de mediação" },
    { artigo: "334", prazo: "20 dias", dias: 20, acao: "Prazo mínimo para a citação do réu para audiência de conciliação ou de mediação" },
    { artigo: "334, §5º", prazo: "10 dias", dias: 10, acao: "Antecedência da indicação do desinteresse na autocomposição pelo réu" },
    { artigo: "335", prazo: "15 dias", dias: 15, acao: "Oferecimento da contestação" },
    { artigo: "338", prazo: "15 dias", dias: 15, acao: "Possibilidade do autor alterar a petição inicial para substituir o réu, alegando ser parte ilegítima" },
    { artigo: "339, §1º", prazo: "15 dias", dias: 15, acao: "Alteração da petição inicial para a substituição do réu, quando aceita a indicação" },
    { artigo: "339, §2º", prazo: "15 dias", dias: 15, acao: "Alteração da petição inicial para incluir, como litisconsorte passivo, o sujeito indicado pelo réu" },
    { artigo: "343, §1º", prazo: "15 dias", dias: 15, acao: "Apresentação de resposta na reconvenção" },
    { artigo: "350", prazo: "15 dias", dias: 15, acao: "Oitiva do réu ao alegar fato impeditivo, modificativo ou extintivo do direito do autor" },
    { artigo: "351", prazo: "15 dias", dias: 15, acao: "Oitiva do autor quanto às matérias enumeradas no art. 337" },
    { artigo: "352", prazo: "30 dias", dias: 30, acao: "Correção de irregularidades ou de vícios sanáveis" },
    { artigo: "357, §1º", prazo: "5 dias", dias: 5, acao: "Pedido de esclarecimentos ou ajustes uma vez realizado o saneamento" },
    { artigo: "357, §4º", prazo: "15 dias", dias: 15, acao: "Apresentação de rol de testemunhas" },
    { artigo: "364, §2º", prazo: "15 dias", dias: 15, acao: "Após audiência, apresentação de razões finais escritas, quando a causa apresentar questões complexas" },
    { artigo: "366", prazo: "30 dias", dias: 30, acao: "Pronunciamento da sentença após audiência" },
    { artigo: "398", prazo: "5 dias", dias: 5, acao: "Resposta quanto ao pedido de exibição de documento ou coisa" },
    { artigo: "401", prazo: "15 dias", dias: 15, acao: "Resposta de terceiro quando o documento ou coisa estiver em seu poder" },
    { artigo: "403", prazo: "5 dias", dias: 5, acao: "Depósito do documento ou coisa por terceiro, quando recusou sem justo motivo" },
    { artigo: "430", prazo: "15 dias", dias: 15, acao: "Arguição de falsidade" },
    { artigo: "432", prazo: "15 dias", dias: 15, acao: "Oitiva da parte oposta quanto à arguição de falsidade" },
    { artigo: "437, §1º", prazo: "15 dias", dias: 15, acao: "Período para parte oposta adotar postura indicada no art. 436, quando requerida juntada de documento" },
    { artigo: "455, §1º", prazo: "3 dias", dias: 3, acao: "Antecedência para advogado juntar cópia da correspondência de intimação da testemunha" },
    { artigo: "462", prazo: "3 dias", dias: 3, acao: "Pagamento das despesas de deslocamento da testemunha" },
    { artigo: "465, §1º", prazo: "15 dias", dias: 15, acao: "Arguição de impedimento, indicação de assistente técnico e apresentação de quesitos após nomeação do perito" },
    { artigo: "465, §2º", prazo: "5 dias", dias: 5, acao: "Apresentação da proposta de honorários, currículo e contatos profissionais pelo perito" },
    { artigo: "465, §3º", prazo: "5 dias", dias: 5, acao: "Manifestação das partes quanto à proposta de honorários do perito" },
    { artigo: "466, §2º", prazo: "5 dias", dias: 5, acao: "Prévia comunicação aos assistentes das partes, por perito, para acompanhamento das diligências" },
    { artigo: "468, §2º", prazo: "15 dias", dias: 15, acao: "Restituição, por perito, dos valores recebidos por trabalho não realizado" },
    { artigo: "477", prazo: "20 dias", dias: 20, acao: "Antecedência de protocolização de laudo em juízo, pelo perito, antes da audiência" },
    { artigo: "477, §1º", prazo: "15 dias", dias: 15, acao: "Manifestação opcional pelas partes quanto ao laudo pericial" },
    { artigo: "477, §2º", prazo: "15 dias", dias: 15, acao: "Esclarecimento de pontos de divergência ou dúvida pelo perito" },
    { artigo: "477, §4º", prazo: "10 dias", dias: 10, acao: "Antecedência da intimação de perito ou assistente técnico para audiência" },
    { artigo: "485, III", prazo: "30 dias", dias: 30, acao: "Período que caracteriza abandono de causa" },
    { artigo: "485, §1º", prazo: "5 dias", dias: 5, acao: "Suprir a falta de andamento no processo, de acordo com os incisos II e III" },
    { artigo: "485, §7º", prazo: "5 dias", dias: 5, acao: "Retratação do juiz nos casos dos incisos do artigo" },
    { artigo: "495, §3º", prazo: "15 dias", dias: 15, acao: "Período para informar ao juízo da causa da realização da hipoteca judiciária" },
    { artigo: "511", prazo: "15 dias", dias: 15, acao: "Apresentação de contestação na liquidação de sentença pelo procedimento comum" },
    { artigo: "515, §1º", prazo: "15 dias", dias: 15, acao: "Citação do devedor para cumprimento da sentença ou liquidação no juízo cível" },
    { artigo: "517, §2º", prazo: "3 dias", dias: 3, acao: "Fornecimento da certidão de teor da decisão, para protesto" },
    { artigo: "517, §4º", prazo: "3 dias", dias: 3, acao: "Cancelamento do protesto por determinação do juiz, desde que comprovada a satisfação integral da obrigação" },
    { artigo: "523", prazo: "15 dias", dias: 15, acao: "Pagamento de débito pelo executado" },
    { artigo: "524, §2º", prazo: "30 dias", dias: 30, acao: "Verificação dos cálculos pelo contabilista do juízo" },
    { artigo: "524, §4º", prazo: "30 dias", dias: 30, acao: "Apresentação de dados adicionais em poder do executado" },
    { artigo: "525", prazo: "15 dias", dias: 15, acao: "Apresentação de impugnação pelo executado" },
    { artigo: "525, §11º", prazo: "15 dias", dias: 15, acao: "Formulação de arguição quanto a fato superveniente, validade e adequação da penhora" },
    { artigo: "526, §1º", prazo: "5 dias", dias: 5, acao: "Oitiva do autor para impugnação do valor depositado voluntariamente pelo réu" },
    { artigo: "528", prazo: "3 dias", dias: 3, acao: "Em prestação alimentícia, período para o executado pagar o débito, provar que o fez ou justificar a impossibilidade" },
    { artigo: "535", prazo: "30 dias", dias: 30, acao: "Impugnação da execução pela Fazenda Pública" },
    { artigo: "539, §1º", prazo: "10 dias", dias: 10, acao: "Manifestação da recusa do credor na consignação em pagamento" },
    { artigo: "541", prazo: "5 dias", dias: 5, acao: "Depósito de prestações sucessivas na consignação em pagamento" },
    { artigo: "542, I", prazo: "5 dias", dias: 5, acao: "Depósito da quantia ou da coisa devida" },
    { artigo: "543", prazo: "5 dias", dias: 5, acao: "Exercício do direito de escolha pelo credor em prestação de coisa indeterminada" },
    { artigo: "545", prazo: "10 dias", dias: 10, acao: "Complementação de depósito insuficiente" },
    { artigo: "550", prazo: "15 dias", dias: 15, acao: "Prestação de contas ou oferecimento de contestação pelo réu em ação de exigir contas" },
    { artigo: "550, §2º", prazo: "15 dias", dias: 15, acao: "Manifestação do autor quando prestadas as contas" },
    { artigo: "550, §5º", prazo: "15 dias", dias: 15, acao: "Prestação de contas pelo réu após pedido ser julgado procedente" },
    { artigo: "550, §6º", prazo: "15 dias", dias: 15, acao: "Apresentação de contas pelo autor, quando não forem apresentadas pelo réu" },
    { artigo: "559", prazo: "5 dias", dias: 5, acao: "Período para o réu requerer caução, real ou fidejussória de autor que carece de idoneidade financeira" },
    { artigo: "564", prazo: "5 dias", dias: 5, acao: "Citação do réu em casos de manutenção ou reintegração de posse" },
    { artigo: "564", prazo: "15 dias", dias: 15, acao: "Contestação do réu após citação em casos de manutenção ou reintegração de posse" },
    { artigo: "565", prazo: "30 dias", dias: 30, acao: "Realização de audiência de mediação em litígio coletivo pela posse de imóvel" },
    { artigo: "577", prazo: "15 dias", dias: 15, acao: "Contestação dos réus em ação de demarcação" },
    { artigo: "586", prazo: "15 dias", dias: 15, acao: "Manifestação das partes quanto a relatório dos peritos" },
    { artigo: "591", prazo: "10 dias", dias: 10, acao: "Apresentação de títulos e formulação de pedidos sobre a constituição dos quinhões pelos condôminos" },
    { artigo: "592", prazo: "15 dias", dias: 15, acao: "Oitiva das partes em ação de divisão" },
    { artigo: "592, §2º", prazo: "10 dias", dias: 10, acao: "Decisão do juiz sobre os pedidos e títulos, havendo impugnação" },
    { artigo: "596", prazo: "15 dias", dias: 15, acao: "Oitiva das partes sobre cálculo e plano da divisão" },
    { artigo: "600, IV", prazo: "10 dias", dias: 10, acao: "Propositura de ação de dissolução parcial de sociedade por sócio" },
    { artigo: "601", prazo: "15 dias", dias: 15, acao: "Período para os sócios e a sociedade concordarem ou contestarem em ação de dissolução parcial" },
    { artigo: "617, § único", prazo: "5 dias", dias: 5, acao: "Prestação de compromisso por inventariante" },
    { artigo: "620", prazo: "20 dias", dias: 20, acao: "Apresentação das primeiras declarações por inventariante" },
    { artigo: "623", prazo: "15 dias", dias: 15, acao: "Período para inventariante defender-se e produzir provas, quando requerida sua remoção" },
    { artigo: "627", prazo: "15 dias", dias: 15, acao: "Manifestação das partes quanto às primeiras declarações" },
    { artigo: "628, §1º", prazo: "15 dias", dias: 15, acao: "Oitiva das partes quanto ao pedido de admissão de preteridos no inventário" },
    { artigo: "629", prazo: "15 dias", dias: 15, acao: "Informação do valor dos bens de raiz pela Fazenda Pública" },
    { artigo: "635", prazo: "15 dias", dias: 15, acao: "Manifestação das partes quanto a laudo de avaliação para cálculo de imposto" },
    { artigo: "637", prazo: "15 dias", dias: 15, acao: "Oitiva das partes quanto às últimas declarações" },
    { artigo: "638", prazo: "5 dias", dias: 5, acao: "Oitiva das partes quanto ao cálculo do imposto" },
    { artigo: "641", prazo: "15 dias", dias: 15, acao: "Oitiva das partes quando herdeiro negar recebimento dos bens ou obrigação de os conferir" },
    { artigo: "641, §1º", prazo: "15 dias", dias: 15, acao: "Período para herdeiro proceder à conferência quando a oposição for declarada improcedente" },
    { artigo: "647", prazo: "15 dias", dias: 15, acao: "Formulação do pedido de quinhão pelas partes" },
    { artigo: "652", prazo: "15 dias", dias: 15, acao: "Manifestação das partes quanto ao esboço de partilha" },
    { artigo: "664, §1º", prazo: "10 dias", dias: 10, acao: "Período em que avaliador deverá oferecer laudo, quando impugnada a estimativa" },
    { artigo: "668, I", prazo: "30 dias", dias: 30, acao: "Cessa a eficácia da tutela provisória se ação não for proposta" },
    { artigo: "675", prazo: "5 dias", dias: 5, acao: "Oposição de embargos de terceiro no cumprimento de sentença ou no processo de execução" },
    { artigo: "679", prazo: "15 dias", dias: 15, acao: "Contestação dos embargos de terceiro" },
    { artigo: "683, § único", prazo: "15 dias", dias: 15, acao: "Contestação do pedido de oposição" },
    { artigo: "690", prazo: "5 dias", dias: 5, acao: "Manifestação dos requeridos em pedido de habilitação" },
    { artigo: "695, §2º", prazo: "15 dias", dias: 15, acao: "Antecedência da citação do réu em ações de família" },
    { artigo: "701", prazo: "15 dias", dias: 15, acao: "Cumprimento e pagamento de honorários advocatícios pelo réu em ação monitória" },
    { artigo: "702, §5º", prazo: "15 dias", dias: 15, acao: "Manifestação do autor quanto aos embargos em ação monitória" },
    { artigo: "703, §3º", prazo: "5 dias", dias: 5, acao: "Pagamento do débito ou impugnação da cobrança pelo devedor para homologação do penhor legal" },
    { artigo: "708, §1º", prazo: "10 dias", dias: 10, acao: "Decisão do juiz quando parte não concordar com o regulador quanto à avaria grossa" },
    { artigo: "710, §1º", prazo: "15 dias", dias: 15, acao: "Período em que as partes terão vista do regulamento da avaria grossa" },
    { artigo: "710, §2º", prazo: "10 dias", dias: 10, acao: "Decisão quanto ao regulamento da avaria grossa, após oitiva do regulador, havendo impugnação" },
    { artigo: "714", prazo: "5 dias", dias: 5, acao: "Contestação do pedido pela parte contrária em ação de restauração de autos" },
    { artigo: "721", prazo: "15 dias", dias: 15, acao: "Manifestação opcional dos interessados em procedimentos de jurisdição voluntária" },
    { artigo: "723", prazo: "10 dias", dias: 10, acao: "Decisão do juiz sobre o pedido" },
    { artigo: "734, §1º", prazo: "30 dias", dias: 30, acao: "Período após publicação do edital em que o juiz pode decidir sobre alteração do regime de bens" },
    { artigo: "752", prazo: "15 dias", dias: 15, acao: "Impugnação do pedido pelo interditando" },
    { artigo: "759", prazo: "5 dias", dias: 5, acao: "Prestação de compromisso pelo tutor ou curador" },
    { artigo: "760", prazo: "5 dias", dias: 5, acao: "Período para tutor ou curador apresentar escusa para eximir-se do encargo" },
    { artigo: "761, § único", prazo: "5 dias", dias: 5, acao: "Citação do tutor ou curador para contestação da arguição" },
    { artigo: "763, §1º", prazo: "10 dias", dias: 10, acao: "Requerimento de exoneração do encargo pelo tutor ou curador após expiração do termo" },
    { artigo: "792, §4º", prazo: "15 dias", dias: 15, acao: "Oposição opcional de embargos de terceiro pelo terceiro adquirente, antes da declaração de fraude à execução" },
    { artigo: "800", prazo: "10 dias", dias: 10, acao: "Exercício de opção e realização da prestação nas obrigações alternativas" },
    { artigo: "801", prazo: "15 dias", dias: 15, acao: "Correção da petição inicial pelo exequente" },
    { artigo: "806", prazo: "15 dias", dias: 15, acao: "Satisfação da obrigação de entrega de coisa certa pelo devedor" },
    { artigo: "812", prazo: "15 dias", dias: 15, acao: "Impugnação da escolha feita pela outra parte na entrega de coisa incerta" },
    { artigo: "818", prazo: "10 dias", dias: 10, acao: "Oitiva das partes quanto à satisfação da obrigação" },
    { artigo: "819", prazo: "15 dias", dias: 15, acao: "Requerimento para que o exequente conclua ou repare a prestação, à custa do contratante" },
    { artigo: "819, § único", prazo: "15 dias", dias: 15, acao: "Oitiva do contratante quanto à avaliação do custo das despesas necessárias" },
    { artigo: "820, § único", prazo: "5 dias", dias: 5, acao: "Exercício do direito de preferência" },
    { artigo: "827, §1º", prazo: "3 dias", dias: 3, acao: "Obtenção de redução dos honorários advocatícios pela metade no caso de pagamento integral" },
    { artigo: "828, §1º", prazo: "10 dias", dias: 10, acao: "Comunicação ao juízo das averbações efetivadas (bens sujeitos a penhora, arresto ou indisponibilidade)" },
    { artigo: "828, §2º", prazo: "10 dias", dias: 10, acao: "Período para o exequente providenciar o cancelamento das averbações relativas aos bens não penhorados" },
    { artigo: "829", prazo: "3 dias", dias: 3, acao: "Citação para pagamento da dívida pelo executado" },
    { artigo: "830, §1º", prazo: "10 dias", dias: 10, acao: "Procura do executado pelo oficial de justiça após efetivação do arresto" },
    { artigo: "847", prazo: "10 dias", dias: 10, acao: "Requerimento da substituição do bem penhorado pelo executado" },
    { artigo: "853", prazo: "3 dias", dias: 3, acao: "Oitiva da parte oposta antes da decisão quanto ao pedido de modificação" },
    { artigo: "854, §3º", prazo: "5 dias", dias: 5, acao: "Comprovação de impenhorabilidade das quantias indisponíveis ou de indisponibilidade excessiva" },
    { artigo: "857, §1º", prazo: "10 dias", dias: 10, acao: "Declaração da preferência por alienação judicial do direito penhorado" },
    { artigo: "862", prazo: "10 dias", dias: 10, acao: "Apresentação do plano de administração quando a penhora recair em estabelecimento comercial, industrial ou agrícola" },
    { artigo: "870, § único", prazo: "10 dias", dias: 10, acao: "Entrega de laudo de avaliação por oficial de justiça" },
    { artigo: "872, §2º", prazo: "5 dias", dias: 5, acao: "Oitiva das partes quanto à proposta de desmembramento" },
    { artigo: "877", prazo: "5 dias", dias: 5, acao: "Lavratura do auto de adjudicação" },
    { artigo: "884, IV", prazo: "1 dia", dias: 1, acao: "Recebimento e depósito do produto da alienação pelo leiloeiro público" },
    { artigo: "884, V", prazo: "2 dias", dias: 2, acao: "Prestação de contas do depósito pelo leiloeiro público" },
    { artigo: "887, §1º", prazo: "5 dias", dias: 5, acao: "Antecedência mínima para publicação do edital antes da data do leilão" },
    { artigo: "889", prazo: "5 dias", dias: 5, acao: "Antecedência de cientificação da alienação judicial dos sujeitos previstos nos incisos" },
    { artigo: "892, §1º", prazo: "3 dias", dias: 3, acao: "Depósito da diferença pelo exequente, se o valor dos bens exceder ao seu crédito" },
    { artigo: "903, §2º", prazo: "10 dias", dias: 10, acao: "Decisão a respeito da invalidez, ineficácia ou resolução da arrematação" },
    { artigo: "903, §5, I", prazo: "10 dias", dias: 10, acao: "Prova de existência de ônus real ou gravame não mencionado no edital para desistência da arrematação" },
    { artigo: "910", prazo: "30 dias", dias: 30, acao: "Oposição de embargos pela Fazenda Pública nas execuções" },
    { artigo: "911", prazo: "3 dias", dias: 3, acao: "Período para o executado efetuar o pagamento em execução de alimentos" },
    { artigo: "915", prazo: "15 dias", dias: 15, acao: "Oferecimento dos embargos à execução" },
    { artigo: "916, §1º", prazo: "5 dias", dias: 5, acao: "Decisão do juiz sobre o requerimento do exequente de pagar o restante em até 6 parcelas" },
    { artigo: "917, §1º", prazo: "15 dias", dias: 15, acao: "Impugnação por incorreção da penhora ou da avaliação" },
    { artigo: "920, I", prazo: "15 dias", dias: 15, acao: "Oitiva do exequente após recebidos os embargos à execução" },
    { artigo: "921, IV", prazo: "15 dias", dias: 15, acao: "Suspensão da execução se o exequente não requerer a adjudicação nem indicar outros bens penhoráveis" },
    { artigo: "921, §5º", prazo: "15 dias", dias: 15, acao: "Reconhecimento da prescrição de que trata o §4º" },
    { artigo: "931", prazo: "30 dias", dias: 30, acao: "Restituição dos autos, com relatório, à secretaria" },
    { artigo: "932, § único", prazo: "5 dias", dias: 5, acao: "Período para recorrente sanar vício ou complementar documentação exigível" },
    { artigo: "933", prazo: "5 dias", dias: 5, acao: "Manifestação das partes quanto a fato superveniente à decisão recorrida" },
    { artigo: "935", prazo: "5 dias", dias: 5, acao: "Antecedência da publicação da pauta para data do julgamento" },
    { artigo: "940", prazo: "10 dias", dias: 10, acao: "Tempo máximo de vista de autos que o relator ou outro juiz pode solicitar" },
    { artigo: "943, §2º", prazo: "10 dias", dias: 10, acao: "Publicação da ementa no órgão oficial após lavrado o acórdão" },
    { artigo: "944", prazo: "30 dias", dias: 30, acao: "Substituição do acórdão pelas notas taquigráficas" },
    { artigo: "956", prazo: "5 dias", dias: 5, acao: "Oitiva do Ministério Público no conflito de competência" },
    { artigo: "970", prazo: "15–30 dias", dias: 15, acao: "Apresentação, opcional, da resposta pelo réu em ação rescisória" },
    { artigo: "973", prazo: "10 dias", dias: 10, acao: "Abertura de vista ao autor e ao réu para razões finais em ação rescisória" },
    { artigo: "982, II", prazo: "15 dias", dias: 15, acao: "Prestação de informações requisitadas pelo relator em incidente de resolução de demandas repetitivas" },
    { artigo: "982, III", prazo: "15 dias", dias: 15, acao: "Manifestação, opcional, do Ministério Público em incidente de resolução de demandas repetitivas" },
    { artigo: "983", prazo: "15 dias", dias: 15, acao: "Requerimento da juntada de documentos e diligências necessárias, pelas partes e demais interessados" },
    { artigo: "984, II, b", prazo: "2 dias", dias: 2, acao: "Antecedência de inscrição para sustentação das razões no julgamento do tribunal" },
    { artigo: "989, I", prazo: "10 dias", dias: 10, acao: "Prestação de informações pela autoridade a quem for imputada a prática do ato impugnado" },
    { artigo: "989, III", prazo: "15 dias", dias: 15, acao: "Apresentação da contestação pelo beneficiário da decisão impugnada" },
    { artigo: "991", prazo: "5 dias", dias: 5, acao: "Vista do processo pelo Ministério Público" },
    { artigo: "1.003, §5º", prazo: "15 dias", dias: 15, acao: "Interposição e resposta dos recursos, com exceção dos embargos de declaração" },
    { artigo: "1.006", prazo: "5 dias", dias: 5, acao: "Providência da baixa dos autos ao juízo de origem, após trânsito em julgado" },
    { artigo: "1.007, §2º", prazo: "5 dias", dias: 5, acao: "Período para suprir insuficiência no valor do preparo" },
    { artigo: "1.007, §6º", prazo: "5 dias", dias: 5, acao: "Efetuação do preparo pelo recorrente, após provar justo impedimento" },
    { artigo: "1.007, §7º", prazo: "5 dias", dias: 5, acao: "Período para o recorrente sanar equívoco no preenchimento da guia de custas" },
    { artigo: "1.009, §2º", prazo: "15 dias", dias: 15, acao: "Manifestação do recorrente, quando as questões referidas no §1º forem suscitadas em contrarrazões" },
    { artigo: "1.010, §1º", prazo: "15 dias", dias: 15, acao: "Apresentação de contrarrazões pelo apelado" },
    { artigo: "1.018, §2º", prazo: "3 dias", dias: 3, acao: "Requerimento da juntada de cópia da petição do agravo de instrumento aos autos do processo" },
    { artigo: "1.019", prazo: "5 dias", dias: 5, acao: "Período em que o relator pode executar ações previstas nos incisos" },
    { artigo: "1.019, II", prazo: "15 dias", dias: 15, acao: "Resposta do agravado ao agravo de instrumento" },
    { artigo: "1.019, III", prazo: "15 dias", dias: 15, acao: "Manifestação do Ministério Público em agravo de instrumento" },
    { artigo: "1.021, §2º", prazo: "15 dias", dias: 15, acao: "Manifestação do agravado sobre recurso em agravo interno" },
    { artigo: "1.023", prazo: "5 dias", dias: 5, acao: "Oposição de embargos de declaração" },
    { artigo: "1.023, §2º", prazo: "5 dias", dias: 5, acao: "Manifestação, opcional, do embargado sobre os embargos opostos" },
    { artigo: "1.024", prazo: "5 dias", dias: 5, acao: "Julgamento dos embargos declaratórios" },
    { artigo: "1.024, §3º", prazo: "5 dias", dias: 5, acao: "Complementação das razões recursais para conhecer os embargos de declaração como agravo interno" },
    { artigo: "1.024, §4º", prazo: "15 dias", dias: 15, acao: "Complementação ou alteração das razões em recurso interposto caso acolhimento dos embargos implique modificação da decisão" },
    { artigo: "1.028, §2º", prazo: "15 dias", dias: 15, acao: "Apresentação das contrarrazões ao recurso ordinário" },
    { artigo: "1.030", prazo: "15 dias", dias: 15, acao: "Apresentação das contrarrazões aos recursos extraordinário e especial" },
    { artigo: "1.032", prazo: "15 dias", dias: 15, acao: "Período para o recorrente demonstrar a existência de repercussão geral no recurso especial" },
    { artigo: "1.035, §6º", prazo: "5 dias", dias: 5, acao: "Manifestação do recorrente sobre exclusão do sobrestamento e inadmissão do recurso extraordinário" },
    { artigo: "1.036, §2º", prazo: "5 dias", dias: 5, acao: "Manifestação do recorrente sobre exclusão do sobrestamento e inadmissão do recurso especial ou extraordinário" },
    { artigo: "1.037, §11º", prazo: "5 dias", dias: 5, acao: "Oitiva da outra parte quanto ao requerimento de prosseguimento do processo" },
    { artigo: "1.038, §1º", prazo: "15 dias", dias: 15, acao: "Requisição de informações aos tribunais inferiores e intimação à manifestação do Ministério Público" },
    { artigo: "1.042, §3º", prazo: "15 dias", dias: 15, acao: "Resposta do agravado ao agravo em recurso especial ou extraordinário" },
    { artigo: "1.050", prazo: "30 dias", dias: 30, acao: "Período para os entes públicos se cadastrarem perante a administração do tribunal" },
    { artigo: "1.051", prazo: "30 dias", dias: 30, acao: "Período para empresas públicas e privadas cumprirem o disposto no art. 246, §1º" },
    { artigo: "1.067: art. 275, §1º/Cód. Eleitoral", prazo: "3 dias", dias: 3, acao: "Oposição dos embargos de declaração no código eleitoral" },
    { artigo: "1.067: art. 275, §3º/Cód. Eleitoral", prazo: "5 dias", dias: 5, acao: "Julgamento dos embargos de declaração no código eleitoral" },
    { artigo: "1.070", prazo: "15 dias", dias: 15, acao: "Interposição de qualquer agravo contra decisão de relator ou decisão unipessoal proferida em tribunal" },
    { artigo: "1.071: art. 216-A, §2º/LRP", prazo: "15 dias", dias: 15, acao: "Manifestação do consentimento expresso dos titulares de direitos reais em usucapião extrajudicial" },
    { artigo: "1.071: art. 216-A, §3º/LRP", prazo: "15 dias", dias: 15, acao: "Manifestação da União, Estado, Distrito Federal e Município sobre o pedido" },
    { artigo: "1.071: art. 216-A, §4º/LRP", prazo: "15 dias", dias: 15, acao: "Manifestação de terceiros eventualmente interessados" },
];

export const CpcReferenceCatalog: React.FC<CpcReferenceCatalogProps> = ({ onClose, onSelect }) => {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return CPC_PRAZOS;
        const term = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return CPC_PRAZOS.filter(p =>
            p.artigo.toLowerCase().includes(term) ||
            p.acao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term) ||
            p.prazo.toLowerCase().includes(term)
        );
    }, [search]);

    const handleSelect = (item: CpcPrazo) => {
        onSelect(item.dias, item.acao);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-dark-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <BookOpen size={22} className="text-blue-500" />
                            Consultar Prazos CPC/2015
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                        Tabela de referência dos principais prazos do Novo CPC. Clique em um item para preencher automaticamente os campos do formulário.
                    </p>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Pesquisar por artigo ou descrição..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'} encontrado{filtered.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-dark-900 z-10">
                            <tr>
                                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[130px]">
                                    Artigo (CPC)
                                </th>
                                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[90px] text-center">
                                    Prazo
                                </th>
                                <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Ação / Descrição
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => handleSelect(item)}
                                    className={`
                                        border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-all
                                        hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm
                                        active:scale-[0.995]
                                        ${idx % 2 === 0 ? 'bg-white dark:bg-dark-800' : 'bg-slate-50/50 dark:bg-dark-800/60'}
                                    `}
                                >
                                    <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-200 font-mono whitespace-nowrap">
                                        Art. {item.artigo}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold whitespace-nowrap">
                                            {item.prazo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300 leading-snug">
                                        {item.acao}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-10 text-center text-slate-400 dark:text-slate-500">
                                        <Search size={32} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">Nenhum prazo encontrado para "{search}"</p>
                                        <p className="text-xs mt-1">Tente pesquisar por outro artigo ou descrição.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50 shrink-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                        Fonte: CPC/2015 — Tabela de referência para consulta rápida. Não nos responsabilizamos por eventuais inconsistências.
                    </p>
                </div>
            </div>
        </div>
    );
};
