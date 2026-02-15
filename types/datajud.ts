export interface DataJudConfig { apiKey: string; tribunal: string; }
export interface CodeNamePair { codigo: number; nome: string; }
export interface OrgaoJulgador extends CodeNamePair { codigoMunicipioIBGE?: number; }
export interface Polo { polo: 'AT' | 'PA'; partes: { nome: string; tipoPessoa: 'Fisica' | 'Juridica'; }[]; }
export interface Movimento extends CodeNamePair { dataHora: string; complementosTabelados?: { nome: string; descricao: string; }[]; }
export interface ProcessSource {
    id: string; numeroProcesso: string; classe: CodeNamePair; orgaoJulgador: OrgaoJulgador;
    dataAjuizamento: string; dataHoraUltimaAtualizacao: string; nivelSigilo: number; grau: string;
    tribunal: string; sistema: CodeNamePair; formato: CodeNamePair; assuntos: CodeNamePair[];
    polos: Polo[]; movimentos: Movimento[];
}
export interface DataJudHit { _index: string; _id: string; _source: ProcessSource; }
export interface DataJudResponse { hits: { total: { value: number }; hits: DataJudHit[]; }; }
