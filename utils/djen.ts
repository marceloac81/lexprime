import { DJENResponse } from '../types';

const BASE_URL = 'https://comunicaapi.pje.jus.br/api/v1';

interface FetchPublicationsParams {
    numeroOab?: string;
    ufOab?: string;
    numeroProcesso?: string;
    dataDisponibilizacaoInicio?: string;
    dataDisponibilizacaoFim?: string;
    pagina?: number;
    itensPorPagina?: number;
}

export const fetchPublications = async (params: FetchPublicationsParams): Promise<DJENResponse> => {
    const queryParams = new URLSearchParams();

    if (params.numeroOab) queryParams.append('numeroOab', params.numeroOab);
    if (params.ufOab) queryParams.append('ufOab', params.ufOab);
    if (params.numeroProcesso) queryParams.append('numeroProcesso', params.numeroProcesso);
    if (params.dataDisponibilizacaoInicio) queryParams.append('dataDisponibilizacaoInicio', params.dataDisponibilizacaoInicio);
    if (params.dataDisponibilizacaoFim) queryParams.append('dataDisponibilizacaoFim', params.dataDisponibilizacaoFim);

    if (params.pagina && params.pagina > 0) queryParams.append('pagina', params.pagina.toString());
    if (params.itensPorPagina) queryParams.append('itensPorPagina', params.itensPorPagina.toString());
    else queryParams.append('itensPorPagina', '10'); // Default

    try {
        const response = await fetch(`${BASE_URL}/comunicacao?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Muitas requisições. Por favor, aguarde alguns instantes e tente novamente.');
            }
            throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
        }

        const data: DJENResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Erro ao buscar publicações DJEN:", error);
        throw error;
    }
};
