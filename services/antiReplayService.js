// Protección contra replay attacks
const NONCE_STORAGE = 'used_nonces';
const SESSION_STORAGE = 'session_data';
const MAX_NONCES = 1000;
const TIMESTAMP_TOLERANCE = 300000; // 5 minutos

class AntiReplayService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.usedNonces = this.loadUsedNonces();
  }

  // Generar ID de sesión único
  generateSessionId() {
    const stored = sessionStorage.getItem(SESSION_STORAGE);
    if (stored) {
      const session = JSON.parse(stored);
      if (Date.now() - session.created < 3600000) { // 1 hora
        return session.id;
      }
    }

    const sessionId = crypto.getRandomValues(new Uint32Array(4))
      .reduce((acc, val) => acc + val.toString(16), '');
    
    sessionStorage.setItem(SESSION_STORAGE, JSON.stringify({
      id: sessionId,
      created: Date.now()
    }));

    return sessionId;
  }

  // Cargar nonces usados
  loadUsedNonces() {
    try {
      const stored = localStorage.getItem(NONCE_STORAGE);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  // Guardar nonces usados
  saveUsedNonces() {
    const noncesArray = Array.from(this.usedNonces);
    // Mantener solo los últimos MAX_NONCES
    const recentNonces = noncesArray.slice(-MAX_NONCES);
    localStorage.setItem(NONCE_STORAGE, JSON.stringify(recentNonces));
    this.usedNonces = new Set(recentNonces);
  }

  // Generar nonce único
  generateNonce() {
    const timestamp = Date.now();
    const random = crypto.getRandomValues(new Uint32Array(2))
      .reduce((acc, val) => acc + val.toString(16), '');
    
    return `${this.sessionId}-${timestamp}-${random}`;
  }

  // Validar timestamp y nonce
  validateRequest(timestamp, nonce) {
    const now = Date.now();
    
    // Verificar timestamp (no muy viejo ni futuro)
    if (Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE) {
      return {
        valid: false,
        reason: 'timestamp_out_of_range',
        details: `Diferencia: ${Math.abs(now - timestamp)}ms`
      };
    }

    // Verificar que el nonce no haya sido usado
    if (this.usedNonces.has(nonce)) {
      return {
        valid: false,
        reason: 'nonce_already_used',
        details: `Nonce: ${nonce}`
      };
    }

    // Verificar que el nonce pertenezca a esta sesión
    if (!nonce.startsWith(this.sessionId)) {
      return {
        valid: false,
        reason: 'invalid_session',
        details: `Expected session: ${this.sessionId}`
      };
    }

    // Marcar nonce como usado
    this.usedNonces.add(nonce);
    this.saveUsedNonces();

    return { valid: true };
  }

  // Crear request con protección anti-replay
  createSecureRequest(data) {
    const timestamp = Date.now();
    const nonce = this.generateNonce();
    
    return {
      ...data,
      timestamp,
      nonce,
      sessionId: this.sessionId
    };
  }

  // Limpiar nonces antiguos
  cleanupOldNonces() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    const validNonces = Array.from(this.usedNonces).filter(nonce => {
      const parts = nonce.split('-');
      const timestamp = parseInt(parts[1]);
      return timestamp > cutoff;
    });
    
    this.usedNonces = new Set(validNonces);
    this.saveUsedNonces();
  }
}

export default new AntiReplayService();