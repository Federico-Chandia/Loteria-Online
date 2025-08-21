// Manager para Web Worker con debounce y lazy loading
class WorkerManager {
  constructor() {
    this.worker = null;
    this.messageId = 0;
    this.pendingMessages = new Map();
    this.debounceTimers = new Map();
  }

  // Lazy loading del worker
  async initWorker() {
    if (!this.worker) {
      this.worker = new Worker('/workers/cryptoWorker.js');
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
    return this.worker;
  }

  // Manejar respuestas del worker
  handleWorkerMessage(e) {
    const { id, success, result, error } = e.data;
    const pending = this.pendingMessages.get(id);
    
    if (pending) {
      this.pendingMessages.delete(id);
      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error));
      }
    }
  }

  // Enviar mensaje al worker
  async sendMessage(op, payload) {
    await this.initWorker();
    
    const id = ++this.messageId;
    
    return new Promise((resolve, reject) => {
      this.pendingMessages.set(id, { resolve, reject });
      this.worker.postMessage({ id, op, payload });
      
      // Timeout de 30 segundos
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 30000);
    });
  }

  // Operaciones con debounce
  debouncedValidation(key, fn, delay = 500) {
    return new Promise((resolve, reject) => {
      // Cancelar timer anterior
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      // Nuevo timer
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, delay);
      
      this.debounceTimers.set(key, timer);
    });
  }

  // API pública
  async encrypt(data) {
    return this.sendMessage('encrypt', data);
  }

  async decrypt(encryptedData) {
    return this.sendMessage('decrypt', encryptedData);
  }

  async hash(data) {
    return this.sendMessage('hash', data);
  }

  async validateBlockchain(chain) {
    return this.debouncedValidation(
      'blockchain_validation',
      () => this.sendMessage('validateBlockchain', chain),
      1000
    );
  }

  // Cleanup
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingMessages.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export default new WorkerManager();