import IaService from '../services/iaService.js';
class IaController {
    async getIA(req, res) {
        try {
            const { text, interval } = req.body;

            if (!text || !interval) {
                return res.status(400).json({
                    error: 'Os campos "text" e "interval" são obrigatórios.'
                });
            }

            const answer = await IaService.getIA(text, interval);

            return res.status(200).json({
                answer
            });

        } catch (error) {
            console.error('Erro no controller:', error);

            return res.status(500).json({
                error: error.message
            });
        }

    }
}

export default new IaController();