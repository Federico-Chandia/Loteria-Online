// Seguridad avanzada con Web Crypto API
const MASTER_KEY_STORAGE = 'master_key_seed';
const KEY_ROTATION_STORAGE = 'key_rotation_count';
const MAX_OPERATIONS_PER_KEY = 50;

// Generar clave maestra dinámica
const generateMasterKey = async () => {
  let seed = localStorage.getItem(MASTER_KEY_STORAGE);
  if (!seed) {
    seed = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem(MASTER_KEY_STORAGE, Array.from(seed).join(','));
  } else {
    seed = new Uint8Array(seed.split(',').map(n => parseInt(n)));
  }
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', seed, { name: 'PBKDF2' }, false, ['deriveKey']
  );
  
  const rotationCount = parseInt(localStorage.getItem(KEY_ROTATION_STORAGE) || '0');
  const salt = new TextEncoder().encode(`loteria-${rotationCount}-${Date.now()}`);
  
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Rotación automática de claves
const checkKeyRotation = () => {
  const count = parseInt(localStorage.getItem(KEY_ROTATION_STORAGE) || '0');
  if (count >= MAX_OPERATIONS_PER_KEY) {
    localStorage.setItem(KEY_ROTATION_STORAGE, '0');
    localStorage.removeItem(MASTER_KEY_STORAGE);
    return true;
  }
  localStorage.setItem(KEY_ROTATION_STORAGE, (count + 1).toString());
  return false;
};

// Encriptar con Web Crypto API
export const encryptData = async (data) => {
  try {
    checkKeyRotation();
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
  } catch (error) {
    console.error('Error al encriptar:', error);
    return null;
  }
};

// Desencriptar datos
export const decryptData = async (encryptedObj) => {
  try {
    if (!encryptedObj || !encryptedObj.data || !encryptedObj.iv) return null;
    
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
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return null;
  }
};

// Hash con Web Crypto API
export const generateHash = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Verificar integridad
export const verifyIntegrity = async (data, hash) => {
  const currentHash = await generateHash(data);
  return currentHash === hash;
};