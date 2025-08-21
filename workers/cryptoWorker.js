// Web Worker para operaciones criptográficas pesadas
let cachedKey = null;
let keyStorage = new Map();

// Generar clave maestra sin localStorage
const generateMasterKey = async () => {
  if (cachedKey) return cachedKey;
  
  // Usar Map en lugar de localStorage en el worker
  let seed = keyStorage.get('master_key_seed');
  if (!seed) {
    seed = crypto.getRandomValues(new Uint8Array(32));
    keyStorage.set('master_key_seed', Array.from(seed).join(','));
  } else {
    seed = new Uint8Array(seed.split(',').map(n => parseInt(n)));
  }
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', seed, { name: 'PBKDF2' }, false, ['deriveKey']
  );
  
  const rotationCount = parseInt(keyStorage.get('key_rotation_count') || '0');
  const salt = new TextEncoder().encode(`loteria-${rotationCount}-${Date.now()}`);
  
  cachedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return cachedKey;
};

// Operaciones criptográficas
const operations = {
  async encrypt(data) {
    const key = await generateMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    return {
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  },

  async decrypt(encryptedObj) {
    if (!encryptedObj?.data || !encryptedObj?.iv) return null;
    
    const key = await generateMasterKey();
    const encrypted = new Uint8Array(encryptedObj.data);
    const iv = new Uint8Array(encryptedObj.iv);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const jsonString = new TextDecoder().decode(decrypted);
    return JSON.parse(jsonString);
  },

  async hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async validateBlockchain(chain) {
    if (!chain || chain.length === 0) return true;
    
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      
      // Verificar hash del bloque
      const blockData = {
        id: block.id,
        fecha: block.fecha,
        numeros: block.numeros,
        modalidad: block.modalidad,
        timestamp: block.timestamp,
        previousHash: block.previousHash
      };
      
      const expectedHash = await this.hash(blockData);
      if (block.blockHash !== expectedHash) {
        return false;
      }
      
      // Verificar enlace con bloque anterior
      if (i < chain.length - 1) {
        const nextBlock = chain[i + 1];
        if (nextBlock.previousHash !== block.blockHash) {
          return false;
        }
      }
    }
    
    return true;
  }
};

// Escuchar mensajes del hilo principal
self.onmessage = async function(e) {
  const { id, op, payload } = e.data;
  
  try {
    if (!operations[op]) {
      throw new Error(`Operación no soportada: ${op}`);
    }
    const result = await operations[op](payload);
    self.postMessage({ id, success: true, result });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ id, success: false, error: error.message });
  }
};