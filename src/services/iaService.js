import IaRepository from '../repositories/iaRepository.js';

class IaService {
    async getIA(text, interval) {
        try {
            // Repassa a chamada para a camada de repositório
            const response = await IaRepository.getIA(text, interval);
            return response;
        } catch (error) {
            console.error('Erro no IaService:', error);
            throw error;
        }
    }
}

export default new IaService();