import axios, { AxiosResponse } from 'axios';

// Define a estrutura esperada dos dados dentro da resposta
interface ApiDataStructure {
  [dataType: string]: any[];
}

// Define a estrutura do objeto de resposta bem-sucedida retornado por fetchData
// Inclui as propriedades originais da resposta Axios mais os dados com o tipo correto
interface FetchDataSuccessResponse extends AxiosResponse {
  data: ApiDataStructure;
}

export const fetchData = async (year: string): Promise<FetchDataSuccessResponse> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
      console.error("Chave de API não encontrada nas variáveis de ambiente (NEXT_PUBLIC_API_KEY).");
      throw new Error("Configuração de API Key ausente no frontend.");
    }
    const response: AxiosResponse = await axios.get(`https://grapi-backend.onrender.com/extractor?year=${year}`, {
      headers: { // Adicionar esta seção de headers
        'x-api-key': apiKey
      },
      timeout: 30000, 
      validateStatus: (status ) => status === 200,
    });

    // --- CORREÇÃO ---
    // Verifica diretamente o response.data. Deve ser um objeto e não estar vazio.
    // O backend agora retorna diretamente o dicionário de dados em response.data.
    if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data) || Object.keys(response.data).length === 0) {
      // Lança erro se os dados estiverem ausentes, não forem um objeto, forem um array ou estiverem vazios
      console.error("Dados inválidos ou vazios recebidos da API:", response.data);
      throw new Error('Resposta da API sem dados ou em formato inválido');
    }

    // Retorna o objeto de resposta original.
    // page.tsx espera a estrutura completa de AxiosResponse e acessará response.data.
    // Fazemos a asserção de tipo para garantir segurança de tipos no uso posterior.
    return {
       ...response,
       data: response.data as ApiDataStructure // Assegura o tipo de response.data
    };
    
  } catch (error) {
    let errorMessage = 'Erro desconhecido';
    
    if (axios.isAxiosError(error)) {
      // Usa a mensagem de erro específica se disponível, senão usa a mensagem genérica do Axios
      errorMessage = error.response?.data?.error || error.message; // Usa a chave 'error' se o backend enviar erro estruturado
    } else if (error instanceof Error) {
      // Usa a mensagem do erro lançado no bloco try (ex: 'Resposta da API sem dados...')
      errorMessage = error.message;
    }
    
    // Registra o erro detalhado para depuração
    console.error("Erro em fetchData:", errorMessage, error);
    // Relança uma mensagem de erro amigável ao usuário
    throw new Error(`Falha na requisição: ${errorMessage}`);
  }
};
