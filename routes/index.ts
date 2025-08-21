import express from 'express';
import initDB from '../db';
import { Router } from 'express';
import ticketsRouter from './tickets';

const router = express.Router();

router.get('/sorteos', async (req, res) => {
  const db = await initDB();
  const data = await db.all(`SELECT * FROM sorteos ORDER BY fecha DESC LIMIT 10`);
  res.json(data);
});
router.use('/tickets', ticketsRouter);

export default router;





