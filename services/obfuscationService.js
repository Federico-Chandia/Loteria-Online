// Ofuscación básica de código y datos críticos
class ObfuscationService {
  constructor() {
    // Claves de ofuscación rotativas
    this.obfuscationKeys = [
      0x5A, 0x3C, 0x7E, 0x91, 0x2F, 0x84, 0x6B, 0xD2,
      0x48, 0xA7, 0x1E, 0x95, 0x3B, 0x72, 0xC6, 0x59
    ];
    this.keyIndex = 0;
  }

  // Ofuscar string
  obfuscateString(str) {
    const bytes = new TextEncoder().encode(str);
    const obfuscated = bytes.map((byte, index) => {
      const keyByte = this.obfuscationKeys[(this.keyIndex + index) % this.obfuscationKeys.length];
      return byte ^ keyByte;
    });
    
    this.keyIndex = (this.keyIndex + 1) % this.obfuscationKeys.length;
    return Array.from(obfuscated).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Deofuscar string
  deobfuscateString(obfuscatedHex, originalKeyIndex = 0) {
    try {
      const obfuscated = [];
      for (let i = 0; i < obfuscatedHex.length; i += 2) {
        obfuscated.push(parseInt(obfuscatedHex.substr(i, 2), 16));
      }

      const deobfuscated = obfuscated.map((byte, index) => {
        const keyByte = this.obfuscationKeys[(originalKeyIndex + index) % this.obfuscationKeys.length];
        return byte ^ keyByte;
      });

      return new TextDecoder().decode(new Uint8Array(deobfuscated));
    } catch {
      return null;
    }
  }

  // Ofuscar nombres de funciones críticas
  getFunctionName(originalName) {
    const nameMap = {
      'guardarJugada': 'gJ',
      'obtenerJugadas': 'oJ',
      'encryptData': 'eD',
      'decryptData': 'dD',
      'validateJugada': 'vJ',
      'generateHash': 'gH',
      'signData': 'sD',
      'verifySignature': 'vS'
    };
    
    return nameMap[originalName] || originalName;
  }

  // Ofuscar constantes críticas
  obfuscateConstants() {
    return {
      // Claves de storage ofuscadas
      jK: this.obfuscateString('jugadas_historial'),
      hK: this.obfuscateString('jugadas_hash'),
      pK: this.obfuscateString('ecdsa_private_key'),
      nK: this.obfuscateString('used_nonces'),
      
      // Valores críticos ofuscados
      mO: 50, // MAX_OPERATIONS_PER_KEY
      mJ: 3,  // MAX_JUGADAS_PER_MINUTE
      tT: 300000, // TIMESTAMP_TOLERANCE
    };
  }

  // Generar nombres de variables aleatorios
  generateRandomVarName() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 2; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + Math.floor(Math.random() * 99);
  }

  // Ofuscar números críticos
  obfuscateNumber(num) {
    const offset = Math.floor(Math.random() * 1000) + 1000;
    return {
      encoded: num + offset,
      offset: offset
    };
  }

  // Deofuscar números
  deobfuscateNumber(encoded, offset) {
    return encoded - offset;
  }

  // Anti-debugging básico
  addAntiDebugProtection() {
    // Detectar DevTools
    let devtools = { open: false };
    
    setInterval(() => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          console.clear();
          console.log('%cDetección de DevTools', 'color: red; font-size: 20px;');
          // Opcional: limpiar localStorage en desarrollo
          if (process.env.NODE_ENV === 'development') {
            console.warn('DevTools detectado en desarrollo');
          }
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Detectar debugger
    setInterval(() => {
      const start = performance.now();
      debugger; // Esta línea será pausada si hay debugger activo
      const end = performance.now();
      
      if (end - start > 100) {
        console.clear();
        console.log('%cDebugger detectado', 'color: red; font-size: 20px;');
      }
    }, 1000);
  }

  // Generar código ofuscado dinámicamente
  generateObfuscatedCode(functionName, params) {
    const varNames = Array.from({ length: 5 }, () => this.generateRandomVarName());
    const [a, b, c, d, e] = varNames;
    
    return `
      const ${a} = ${JSON.stringify(params)};
      const ${b} = (${c}) => ${c}.split('').reverse().join('');
      const ${d} = ${this.obfuscateString(functionName)};
      const ${e} = this.deobfuscateString(${d});
      return window[${e}] ? window[${e}](${a}) : null;
    `;
  }
}

export default new ObfuscationService();