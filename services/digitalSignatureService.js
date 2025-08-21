// Firmas digitales locales con ECDSA
const PRIVATE_KEY_STORAGE = 'ecdsa_private_key';
const PUBLIC_KEY_STORAGE = 'ecdsa_public_key';

class DigitalSignatureService {
  constructor() {
    this.keyPair = null;
  }

  // Generar par de claves ECDSA
  async generateKeyPair() {
    if (this.keyPair) return this.keyPair;

    try {
      // Intentar cargar claves existentes
      const storedPrivateKey = localStorage.getItem(PRIVATE_KEY_STORAGE);
      const storedPublicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

      if (storedPrivateKey && storedPublicKey) {
        const privateKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPrivateKey),
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        );

        const publicKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPublicKey),
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['verify']
        );

        this.keyPair = { privateKey, publicKey };
        return this.keyPair;
      }

      // Generar nuevas claves
      this.keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      );

      // Exportar y guardar claves
      const privateKeyJwk = await crypto.subtle.exportKey('jwk', this.keyPair.privateKey);
      const publicKeyJwk = await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);

      localStorage.setItem(PRIVATE_KEY_STORAGE, JSON.stringify(privateKeyJwk));
      localStorage.setItem(PUBLIC_KEY_STORAGE, JSON.stringify(publicKeyJwk));

      return this.keyPair;
    } catch (error) {
      console.error('Error generando claves:', error);
      throw error;
    }
  }

  // Firmar datos
  async signData(data) {
    const keyPair = await this.generateKeyPair();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      keyPair.privateKey,
      dataBuffer
    );

    return Array.from(new Uint8Array(signature));
  }

  // Verificar firma
  async verifySignature(data, signature) {
    const keyPair = await this.generateKeyPair();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const signatureBuffer = new Uint8Array(signature);

    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      keyPair.publicKey,
      signatureBuffer,
      dataBuffer
    );
  }

  // Obtener huella digital de clave pública
  async getPublicKeyFingerprint() {
    const keyPair = await this.generateKeyPair();
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(JSON.stringify(publicKeyJwk));
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16);
  }
}

export default new DigitalSignatureService();