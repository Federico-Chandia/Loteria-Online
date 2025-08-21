import workerManager from './workerManager';
import { logEvent, AUDIT_EVENTS } from './auditService';
import { 
  lazyValidateJugada, 
  lazyCheckRateLimit, 
  lazyCreateBlockchain 
} from './lazySecurityService';

const JUGADAS_KEY = 'jugadas_historial';
const HASH_KEY = 'jugadas_hash';

let blockchain = null;
let isLoading = false;

// Lazy loading de blockchain
const getBlockchain = async () => {
  if (!blockchain) {
    blockchain = await lazyCreateBlockchain();
    await loadBlockchain();
  }
  return blockchain;
};

export const guardarJugada = async (jugada) => {
  try {
    // Rate limit check
    const rateCheck = await lazyCheckRateLimit();
    if (!rateCheck.allowed) {
      logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { reason: 'rate_limit_exceeded' });
      throw new Error(`Demasiadas jugadas. Espera ${rateCheck.remainingTime} segundos.`);
    }
    
    // Validación
    const validation = await lazyValidateJugada(jugada.numeros);
    if (!validation.isValid) {
      throw new Error(`Jugada inválida: ${validation.errors.join(', ')}`);
    }
    
    const blockchainInstance = await getBlockchain();
    
    const nuevaJugada = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      numeros: jugada.numeros.map(n => parseInt(n)),
      sorteo: jugada.sorteo || null,
      modalidad: jugada.tipo || 'Tradicional'
    };
    
    // Agregar a blockchain usando worker
    const block = await blockchainInstance.addBlock(nuevaJugada);
    
    // Encriptar en worker
    const chain = blockchainInstance.getChain();
    const encryptedData = await workerManager.encrypt(chain);
    const dataHash = await workerManager.hash(chain);
    
    localStorage.setItem(JUGADAS_KEY, JSON.stringify(encryptedData));
    localStorage.setItem(HASH_KEY, dataHash);
    
    logEvent(AUDIT_EVENTS.JUGADA_CREATED, {
      jugadaId: block.id,
      modalidad: block.modalidad,
      blockIndex: block.index
    });
    
    return block;
  } catch (error) {
    console.error('Error guardando jugada:', error);
    throw error;
  }
};

export const obtenerJugadas = async () => {
  if (isLoading) return [];
  
  try {
    isLoading = true;
    const blockchainInstance = await getBlockchain();
    
    // Validación de blockchain con debounce en worker
    const isValid = await workerManager.validateBlockchain(blockchainInstance.getChain());
    if (!isValid) {
      logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { reason: 'blockchain_integrity_failed' });
      return [];
    }
    
    return blockchainInstance.getChain().reverse();
  } catch (error) {
    console.error('Error obteniendo jugadas:', error);
    return [];
  } finally {
    isLoading = false;
  }
};

// Cargar blockchain desde storage
const loadBlockchain = async () => {
  try {
    const encryptedDataStr = localStorage.getItem(JUGADAS_KEY);
    if (!encryptedDataStr) return;
    
    const encryptedData = JSON.parse(encryptedDataStr);
    const chainData = await workerManager.decrypt(encryptedData);
    
    if (chainData && blockchain) {
      blockchain.loadChain(chainData);
    }
  } catch (error) {
    console.error('Error cargando blockchain:', error);
  }
};

export const limpiarHistorial = () => {
  localStorage.removeItem(JUGADAS_KEY);
  localStorage.removeItem(HASH_KEY);
  blockchain = null;
};