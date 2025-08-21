import CryptoJS from 'crypto-js';

const SECRET_KEY = 'loteria-app-2024-secure-key';

// Encriptar datos sensibles
export const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error al encriptar:', error);
    return null;
  }
};

// Desencriptar datos
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return null;
  }
};

// Generar hash para integridad
export const generateHash = (data) => {
  return CryptoJS.SHA256(JSON.stringify(data)).toString();
};

// Verificar integridad de datos
export const verifyIntegrity = (data, hash) => {
  const currentHash = generateHash(data);
  return currentHash === hash;
};