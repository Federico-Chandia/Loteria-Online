// Script para ofuscar el build de producción
const fs = require('fs');
const path = require('path');

class BuildObfuscator {
  constructor() {
    this.variableMap = new Map();
    this.functionMap = new Map();
    this.stringMap = new Map();
    this.counter = 0;
  }

  // Generar nombre ofuscado
  generateObfuscatedName() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    let num = this.counter++;
    
    do {
      result = chars[num % 26] + result;
      num = Math.floor(num / 26);
    } while (num > 0);
    
    return '_' + result;
  }

  // Ofuscar nombres de variables críticas
  obfuscateVariables(code) {
    const criticalVars = [
      'guardarJugada',
      'obtenerJugadas',
      'encryptData',
      'decryptData',
      'validateJugada',
      'generateHash',
      'signData',
      'verifySignature',
      'blockchain',
      'privateKey',
      'publicKey',
      'signature',
      'nonce',
      'timestamp'
    ];

    let obfuscatedCode = code;
    
    criticalVars.forEach(varName => {
      if (!this.variableMap.has(varName)) {
        this.variableMap.set(varName, this.generateObfuscatedName());
      }
      
      const obfuscatedName = this.variableMap.get(varName);
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      obfuscatedCode = obfuscatedCode.replace(regex, obfuscatedName);
    });

    return obfuscatedCode;
  }

  // Ofuscar strings críticos
  obfuscateStrings(code) {
    const criticalStrings = [
      'jugadas_historial',
      'jugadas_hash',
      'ecdsa_private_key',
      'ecdsa_public_key',
      'used_nonces',
      'session_data',
      'master_key_seed',
      'key_rotation_count'
    ];

    let obfuscatedCode = code;

    criticalStrings.forEach(str => {
      if (!this.stringMap.has(str)) {
        // Convertir a hex
        const hex = Buffer.from(str, 'utf8').toString('hex');
        this.stringMap.set(str, hex);
      }

      const hexValue = this.stringMap.get(str);
      const regex = new RegExp(`['"\`]${str}['"\`]`, 'g');
      obfuscatedCode = obfuscatedCode.replace(
        regex, 
        `Buffer.from('${hexValue}', 'hex').toString('utf8')`
      );
    });

    return obfuscatedCode;
  }

  // Insertar código anti-debugging
  insertAntiDebug(code) {
    const antiDebugCode = `
      // Anti-debugging
      (function() {
        const _0x1a2b = setInterval(() => {
          if (window.outerHeight - window.innerHeight > 160) {
            console.clear();
            localStorage.clear();
            sessionStorage.clear();
          }
        }, 1000);
        
        const _0x3c4d = () => {
          const _0x5e6f = performance.now();
          debugger;
          if (performance.now() - _0x5e6f > 100) {
            console.clear();
            throw new Error('Debug detected');
          }
        };
        
        setInterval(_0x3c4d, 2000);
      })();
    `;

    return antiDebugCode + '\n' + code;
  }

  // Proceso completo de ofuscación
  obfuscateFile(filePath) {
    try {
      let code = fs.readFileSync(filePath, 'utf8');
      
      // Aplicar todas las ofuscaciones
      code = this.insertAntiDebug(code);
      code = this.obfuscateVariables(code);
      code = this.obfuscateStrings(code);
      
      // Minificar espacios
      code = code.replace(/\s+/g, ' ').trim();
      
      // Guardar archivo ofuscado
      const obfuscatedPath = filePath.replace('.js', '.obf.js');
      fs.writeFileSync(obfuscatedPath, code);
      
      console.log(`Archivo ofuscado: ${obfuscatedPath}`);
      return obfuscatedPath;
    } catch (error) {
      console.error(`Error ofuscando ${filePath}:`, error);
      return null;
    }
  }
}

module.exports = BuildObfuscator;