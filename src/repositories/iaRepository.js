import { pool } from '../dataBase/config.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

class IaRepository {

    /**
     * Divide os dados brutos em sub-intervalos menores.
     * Calcula a média para variáveis contínuas e extrai picos (máx/mín) para variáveis sensíveis.
     * @param {Array} data - Array original com os registros do banco
     * @param {Number} numeroDeSubIntervalos - Em quantos blocos a linha do tempo será fatiada
     */
    processTelemetryIntervals(data, numeroDeSubIntervalos = 100) {
        if (!data || data.length === 0) return [];

        // Se tivermos menos dados que o número de intervalos desejados, agrupamos de 1 em 1
        const chunkSize = Math.max(1, Math.ceil(data.length / numeroDeSubIntervalos));
        const processedData = [];

        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);

            // Timestamps que delimitam este sub-intervalo específico
            const inicio = chunk[0].timestamp;
            const fim = chunk[chunk.length - 1].timestamp;

            // --- OPERAÇÕES MATEMÁTICAS ---

            // 1. Médias para grandezas contínuas
            const avgVelocidade = chunk.reduce((acc, curr) => acc + curr.velocidade, 0) / chunk.length;
            const avgAltitude = chunk.reduce((acc, curr) => acc + curr.altitude, 0) / chunk.length;
            const avgTensao = chunk.reduce((acc, curr) => acc + curr.tensao_motor, 0) / chunk.length;

            // 2. Extremos (Máximo e Mínimo) para grandezas sensíveis (estresse estrutural)
            // Mantemos o sinal (positivo/negativo) para entender direção da força G
            const maxAceleracaoZ = Math.max(...chunk.map(c => c.aceleracao_z));
            const minAceleracaoZ = Math.min(...chunk.map(c => c.aceleracao_z));

            // Estruturação no formato requisitado
            processedData.push({
                iniciofim: [inicio, fim],
                data: {
                    velocidade_media: Number(avgVelocidade.toFixed(2)),
                    altitude_media: Number(avgAltitude.toFixed(2)),
                    tensao_motor_media: Number(avgTensao.toFixed(2)),
                    aceleracao_z_max: Number(maxAceleracaoZ.toFixed(2)),
                    aceleracao_z_min: Number(minAceleracaoZ.toFixed(2))
                }
            });
        }

        return processedData;
    }

    async getIA(text, interval) {
        const instruction = `Você é um engenheiro aeronáutico especialista em Aerodesign.
        Analise os blocos de telemetria de voo fornecidos. Cada bloco contém um intervalo de tempo ("iniciofim") e os dados matemáticos consolidados desse período (médias e picos).
        Identifique anomalias aerodinâmicas, estresse estrutural ou variações bruscas de motor. Atenção especial à variação entre aceleracao_z_max e aceleracao_z_min, que podem indicar forte vibração ou flutter.
        Você DEVE retornar a resposta estritamente no formato JSON, contendo as chaves:
        - "parecer_tecnico": texto explicativo com a sua análise detalhada.
        - "pontos_de_atencao": array de strings contendo os arrays de intervalos (ex: ["13:05:10 a 13:05:15", "13:10:00 a 13:10:08"]) que merecem destaque no gráfico.`;

        try {
            const { rows: telemetryData } = await pool.query(
                `SELECT 
                        created_at AS timestamp, 
                        speed_kmh AS velocidade, 
                        altitude, 
                        voltage AS tensao_motor, 
                        aceleration_z AS aceleracao_z 
                    FROM telemetria 
                    WHERE created_at >= $1 AND created_at <= $2 
                    ORDER BY created_at ASC`,
                [interval.start, interval.end]
            );

            if (telemetryData.length === 0) {
                return { parecer_tecnico: "Nenhum dado encontrado para o período selecionado.", pontos_de_atencao: [] };
            }

            // Transforma os dados brutos (ex: 5000 registros) na estrutura exigida dividida em intervalos menores
            // O número 100 define que, independente do tamanho da busca, a IA receberá 100 blocos evolutivos do tempo.
            const dadosEstruturados = this.processTelemetryIntervals(telemetryData, 100);

            // console.log(dadosEstruturados);


            const promptFinal = `Foco da análise solicitado pelo usuário: ${text}\n\nDados de Telemetria (Sub-intervalos de voo):\n${JSON.stringify(dadosEstruturados, null, 2)}`;

            const response = await ai.models.generateContent({
                model: 'gemma-4-31b-it',
                contents: promptFinal,
                config: {
                    systemInstruction: instruction,
                    temperature: 0.2,
                    responseMimeType: "application/json",
                }
            });

            //console.log(JSON.parse(response.text));


            return { ...JSON.parse(response.text), dadosEstruturados };

        } catch (error) {
            console.error('Erro ao gerar análise de telemetria com IA:', error);
            throw error;
        }
    }
}

export default new IaRepository();