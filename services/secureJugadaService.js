import { encryptData, decryptData, generateHash } from './advancedSecurityService';
import { validateJugada, validateTimestamp, checkRateLimit } from './validationService';
import { logEvent, AUDIT_EVENTS } from './auditService';
import { JugadaBlockchain } from './blockchainService';

const JUGADAS_KEY = 'jugadas_historial';
const HASH_KEY = 'jugadas_hash';

let blockchain = new JugadaBlockchain();

export const guardarJugada = async (jugada) => {
  try {
    // Verificar rate limit
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { reason: 'rate_limit_exceeded' });
      throw new Error(`Demasiadas jugadas. Espera ${rateCheck.remainingTime} segundos.`);
    }
    
    // Validar jugada antes de guardar
    const validation = validateJugada(jugada.numeros);
    if (!validation.isValid) {
      throw new Error(`Jugada inválida: ${validation.errors.join(', ')}`);
    }
    
    // Cargar blockchain existente
    await loadBlockchain();
    
    const nuevaJugada = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      numeros: jugada.numeros.map(n => parseInt(n)),
      sorteo: jugada.sorteo || null,
      modalidad: jugada.tipo || 'Tradicional'
    };
    
    // Agregar a blockchain
    const block = await blockchain.addBlock(nuevaJugada);
    
    // Encriptar y guardar blockchain
    const encryptedData = await encryptData(blockchain.getChain());
    const dataHash = await generateHash(blockchain.getChain());
    
    localStorage.setItem(JUGADAS_KEY, JSON.stringify(encryptedData));
    localStorage.setItem(HASH_KEY, dataHash);
    
    // Auditoría
    logEvent(AUDIT_EVENTS.JUGADA_CREATED, {
      jugadaId: block.id,
      modalidad: block.modalidad,
      blockHash: block.blockHash,
      blockIndex: block.index
    });
    
    return block;
  } catch (error) {
    console.error('Error guardando jugada:', error);
    throw error;
  }
};

export const obtenerJugadas = async () => {
  try {
    await loadBlockchain();
    
    // Verificar integridad de la blockchain
    const isValid = await blockchain.verifyChain();
    if (!isValid) {
      logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { reason: 'blockchain_integrity_failed' });
      return [];
    }
    
    const jugadas = blockchain.getChain();
    
    // Validar cada jugada
    const jugadasValidas = jugadas.filter(jugada => {
      if (!jugada.timestamp || !validateTimestamp(jugada.timestamp)) {
        return false;
      }
      
      const validation = validateJugada(jugada.numeros);
      return validation.isValid;
    });
    
    return jugadasValidas.reverse(); // Más recientes primero
  } catch (error) {
    console.error('Error obteniendo jugadas:', error);
    logEvent(AUDIT_EVENTS.DATA_CORRUPTION, { error: error.message });
    return [];
  }
};

// Cargar blockchain desde storage
const loadBlockchain = async () => {
  try {
    const encryptedDataStr = localStorage.getItem(JUGADAS_KEY);
    const storedHash = localStorage.getItem(HASH_KEY);
    
    if (!encryptedDataStr) {
      blockchain = new JugadaBlockchain();
      return;
    }
    
    // Desencriptar datos
    const encryptedData = JSON.parse(encryptedDataStr);
    const chainData = await decryptData(encryptedData);
    
    if (!chainData) {
      logEvent(AUDIT_EVENTS.DATA_CORRUPTION, { reason: 'decryption_failed' });
      blockchain = new JugadaBlockchain();
      return;
    }
    
    // Verificar integridad con hash
    const currentHash = await generateHash(chainData);
    if (storedHash && currentHash !== storedHash) {
      logEvent(AUDIT_EVENTS.DATA_CORRUPTION, { reason: 'hash_mismatch' });
      blockchain = new JugadaBlockchain();
      return;
    }
    
    blockchain.loadChain(chainData);
  } catch (error) {
    console.error('Error cargando blockchain:', error);
    blockchain = new JugadaBlockchain();
  }
};

export const eliminarJugada = (id) => {
  // En blockchain no se pueden eliminar bloques - solo marcar como inválidos
  logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { 
    reason: 'attempted_block_deletion', 
    jugadaId: id 
  });
  throw new Error('No se pueden eliminar jugadas de la blockchain');
};

export const limpiarHistorial = () => {
  try {
    localStorage.removeItem(JUGADAS_KEY);
    localStorage.removeItem(HASH_KEY);
    blockchain = new JugadaBlockchain();
    logEvent(AUDIT_EVENTS.JUGADA_CREATED, { action: 'blockchain_reset' });
  } catch (error) {
    console.error('Error limpiando historial:', error);
    throw error;
  }
};