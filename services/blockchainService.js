import { generateHash } from './advancedSecurityService';
import { logEvent, AUDIT_EVENTS } from './auditService';

// Mini-blockchain para jugadas
export class JugadaBlockchain {
  constructor() {
    this.chain = [];
  }

  // Crear nuevo bloque
  async createBlock(jugadaData, previousHash = '0') {
    const timestamp = Date.now();
    const blockData = {
      ...jugadaData,
      timestamp,
      previousHash
    };
    
    const blockHash = await generateHash(blockData);
    
    return {
      ...blockData,
      blockHash,
      index: this.chain.length
    };
  }

  // Agregar bloque a la cadena
  async addBlock(jugadaData) {
    const previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].blockHash : '0';
    const newBlock = await this.createBlock(jugadaData, previousHash);
    this.chain.push(newBlock);
    return newBlock;
  }

  // Verificar integridad de la cadena
  async verifyChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verificar hash del bloque actual
      const blockData = {
        id: currentBlock.id,
        fecha: currentBlock.fecha,
        numeros: currentBlock.numeros,
        modalidad: currentBlock.modalidad,
        timestamp: currentBlock.timestamp,
        previousHash: currentBlock.previousHash
      };
      
      const expectedHash = await generateHash(blockData);
      if (currentBlock.blockHash !== expectedHash) {
        logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { 
          reason: 'invalid_block_hash', 
          blockIndex: i 
        });
        return false;
      }

      // Verificar enlace con bloque anterior
      if (currentBlock.previousHash !== previousBlock.blockHash) {
        logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { 
          reason: 'broken_chain_link', 
          blockIndex: i 
        });
        return false;
      }
    }
    return true;
  }

  // Obtener cadena completa
  getChain() {
    return this.chain;
  }

  // Cargar cadena desde storage
  loadChain(chainData) {
    this.chain = chainData || [];
  }
}