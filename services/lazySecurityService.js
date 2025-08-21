// Lazy loading de módulos de seguridad
let securityModule = null;
let blockchainModule = null;
let validationModule = null;

// Code splitting con dynamic imports
export const loadSecurityModule = async () => {
  if (!securityModule) {
    securityModule = await import('./advancedSecurityService');
  }
  return securityModule;
};

export const loadBlockchainModule = async () => {
  if (!blockchainModule) {
    blockchainModule = await import('./blockchainService');
  }
  return blockchainModule;
};

export const loadValidationModule = async () => {
  if (!validationModule) {
    validationModule = await import('./validationService');
  }
  return validationModule;
};

// Wrapper con lazy loading
export const lazyEncrypt = async (data) => {
  const { encryptData } = await loadSecurityModule();
  return encryptData(data);
};

export const lazyDecrypt = async (encryptedData) => {
  const { decryptData } = await loadSecurityModule();
  return decryptData(encryptedData);
};

export const lazyHash = async (data) => {
  const { generateHash } = await loadSecurityModule();
  return generateHash(data);
};

export const lazyValidateJugada = async (numeros) => {
  const { validateJugada } = await loadValidationModule();
  return validateJugada(numeros);
};

export const lazyCheckRateLimit = async () => {
  const { checkRateLimit } = await loadValidationModule();
  return checkRateLimit();
};

export const lazyCreateBlockchain = async () => {
  const { JugadaBlockchain } = await loadBlockchainModule();
  return new JugadaBlockchain();
};