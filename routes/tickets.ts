import { Router, Request, Response } from 'express';
import { guardarTicket, obtenerTicketPorCodigo } from '../db';
import crypto from 'crypto';

const router = Router();

/**
 * POST /tickets
 * Crea un nuevo ticket
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { usuario, sorteo_numero, datos } = req.body;

    if (!usuario || !sorteo_numero) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Generar un código único para el ticket (token)
    const ticketCode = crypto.randomBytes(16).toString('hex');

    const nuevoId = guardarTicket(
      ticketCode,
      usuario,
      sorteo_numero,
      new Date().toISOString(),
      JSON.stringify(datos || {})
    );

    res.json({
      id: nuevoId,
      ticket_code: ticketCode,
      usuario,
      sorteo_numero,
      fecha_compra: new Date().toISOString(),
      datos
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /tickets/:codigo
 * Devuelve el ticket si existe
 */
router.get('/:codigo', (req: Request, res: Response) => {
  try {
    const codigo = req.params.codigo;
    const ticket = obtenerTicketPorCodigo(codigo);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(ticket);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
