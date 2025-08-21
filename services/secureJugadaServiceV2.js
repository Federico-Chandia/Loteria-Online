import workerManager from './workerManager';
import digitalSignature from './digitalSignatureService';
import antiReplay from './antiReplayService';
import obfuscation from './obfuscationService';
import { logEvent, AUDIT_EVENTS } from './auditService';
import { validateJugada, checkRateLimit } from './validationService';
import { JugadaBlockchain } from './blockchainService';

// Constantes ofuscadas
const obfuscatedConstants = obfuscation.obfuscateConstants();

class SecureJugadaServiceV2 {
  constructor() {
    // Aplicar protección anti-debugging
    if (typeof window !== 'undefined') {
      obfuscation.addAntiDebugProtection();
    }
    
    this.blockchain = null;
    this.isLoading = false;
  }

  // Guardar jugada con máxima seguridad
  async [obfuscation.getFunctionName('guardarJugada')](jugada) {
    try {
      // Rate limit check
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { 
          reason: 'rate_limit_exceeded',
          fingerprint: await digitalSignature.getPublicKeyFingerprint()
        });
        throw new Error(`Demasiadas jugadas. Espera ${rateCheck.remainingTime} segundos.`);
      }

      // Validación
      const validation = validateJugada(jugada.numeros);
      if (!validation.isValid) {
        throw new Error(`Jugada inválida: ${validation.errors.join(', ')}`);
      }

      // Crear request seguro con anti-replay
      const secureRequest = antiReplay.createSecureRequest({
        numeros: jugada.numeros.map(n => parseInt(n)),
        modalidad: jugada.tipo || 'Tradicional'
      });

      // Validar request (anti-replay)
      const replayValidation = antiReplay.validateRequest(
        secureRequest.timestamp, 
        secureRequest.nonce
      );
      
      if (!replayValidation.valid) {
        logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { 
          reason: 'replay_attack_detected',
          details: replayValidation.reason
        });
        throw new Error('Request inválido detectado');
      }

      // Crear jugada con datos seguros
      const jugadaData = {
        id: secureRequest.timestamp,
        fecha: new Date().toISOString(),
        numeros: secureRequest.numeros,
        modalidad: secureRequest.modalidad,
        sessionId: secureRequest.sessionId,
        nonce: secureRequest.nonce,
        timestamp: secureRequest.timestamp
      };

      // Firmar digitalmente la jugada
      const signature = await digitalSignature.signData(jugadaData);
      const signedJugada = {
        ...jugadaData,
        signature,
        publicKeyFingerprint: await digitalSignature.getPublicKeyFingerprint()
      };

      // Obtener blockchain y agregar bloque
      await this.initBlockchain();
      const block = await this.blockchain.addBlock(signedJugada);

      // Encriptar y guardar usando worker
      const chain = this.blockchain.getChain();
      const encryptedData = await workerManager.encrypt(chain);
      const dataHash = await workerManager.hash(chain);

      // Guardar con claves ofuscadas
      const storageKey = obfuscation.deobfuscateString(obfuscatedConstants.jK, 0);
      const hashKey = obfuscation.deobfuscateString(obfuscatedConstants.hK, 0);
      
      localStorage.setItem(storageKey, JSON.stringify(encryptedData));
      localStorage.setItem(hashKey, dataHash);

      // Auditoría con firma
      logEvent(AUDIT_EVENTS.JUGADA_CREATED, {
        jugadaId: block.id,
        modalidad: block.modalidad,
        signature: signature.slice(0, 16), // Solo primeros bytes por seguridad
        publicKeyFingerprint: block.publicKeyFingerprint,
        sessionId: block.sessionId
      });

      return block;
    } catch (error) {
      console.error('Error guardando jugada:', error);
      throw error;
    }
  }

  // Obtener jugadas con verificación de firmas
  async [obfuscation.getFunctionName('obtenerJugadas')]() {
    if (this.isLoading) return [];
    
    try {
      this.isLoading = true;
      await this.initBlockchain();

      // Validar blockchain con worker (debounced)
      const isValid = await workerManager.validateBlockchain(this.blockchain.getChain());
      if (!isValid) {
        logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { reason: 'blockchain_integrity_failed' });
        return [];
      }

      const jugadas = this.blockchain.getChain();
      const validatedJugadas = [];

      // Verificar firma digital de cada jugada
      for (const jugada of jugadas) {
        if (jugada.signature && jugada.publicKeyFingerprint) {
          // Crear datos para verificación (sin signature)
          const { signature, ...dataToVerify } = jugada;
          
          try {
            const isSignatureValid = await digitalSignature.verifySignature(dataToVerify, signature);
            if (isSignatureValid) {
              validatedJugadas.push(jugada);
            } else {
              logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, { 
                reason: 'invalid_signature',
                jugadaId: jugada.id 
              });
            }
          } catch (error) {
            console.warn('Error verificando firma:', error);
          }
        } else {
          // Jugadas sin firma (legacy) - mantener por compatibilidad
          validatedJugadas.push(jugada);
        }
      }

      return validatedJugadas.reverse();
    } catch (error) {
      console.error('Error obteniendo jugadas:', error);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  // Inicializar blockchain
  async initBlockchain() {
    if (!this.blockchain) {
      this.blockchain = new JugadaBlockchain();
      await this.loadBlockchain();
    }
  }

  // Cargar blockchain desde storage
  async loadBlockchain() {
    try {
      const storageKey = obfuscation.deobfuscateString(obfuscatedConstants.jK, 0);
      const hashKey = obfuscation.deobfuscateString(obfuscatedConstants.hK, 0);
      
      const encryptedDataStr = localStorage.getItem(storageKey);
      if (!encryptedDataStr) return;

      const encryptedData = JSON.parse(encryptedDataStr);
      const chainData = await workerManager.decrypt(encryptedData);

      if (chainData && this.blockchain) {
        this.blockchain.loadChain(chainData);
      }
    } catch (error) {
      console.error('Error cargando blockchain:', error);
    }
  }

  // Limpiar historial de forma segura
  async limpiarHistorial() {
    const storageKey = obfuscation.deobfuscateString(obfuscatedConstants.jK, 0);
    const hashKey = obfuscation.deobfuscateString(obfuscatedConstants.hK, 0);
    
    localStorage.removeItem(storageKey);
    localStorage.removeItem(hashKey);
    
    this.blockchain = null;
    antiReplay.cleanupOldNonces();
    
    logEvent(AUDIT_EVENTS.JUGADA_CREATED, { 
      action: 'secure_blockchain_reset',
      timestamp: Date.now()
    });
  }

  // Exportar datos para auditoría
  async exportAuditData() {
    const jugadas = await this[obfuscation.getFunctionName('obtenerJugadas')]();
    const publicKeyFingerprint = await digitalSignature.getPublicKeyFingerprint();
    
    return {
      exportDate: new Date().toISOString(),
      publicKeyFingerprint,
      totalJugadas: jugadas.length,
      jugadas: jugadas.map(j => ({
        id: j.id,
        fecha: j.fecha,
        modalidad: j.modalidad,
        hasSignature: !!j.signature,
        publicKeyFingerprint: j.publicKeyFingerprint
      }))
    };
  }
}

export default new SecureJugadaServiceV2();