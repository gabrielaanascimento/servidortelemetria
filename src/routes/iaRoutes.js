import { Router } from 'express';
import IaController from '../controllers/iaController.js';

const routes = Router();

// Alterado de GET para POST para permitir o envio do body
routes.post('/ia', IaController.getIA);

export default routes;