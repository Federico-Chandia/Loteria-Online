// Rate limiting
const RATE_LIMIT_KEY = 'rate_limit_data';
const MAX_JUGADAS_PER_MINUTE = 3;
const RATE_LIMIT_WINDOW = 60000; // 1 minuto

// Verificar rate limit
export const checkRateLimit = () => {
  const rateLimitData = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  const now = Date.now();
  
  // Filtrar intentos dentro de la ventana de tiempo
  const recentAttempts = rateLimitData.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentAttempts.length >= MAX_JUGADAS_PER_MINUTE) {
    return {
      allowed: false,
      remainingTime: Math.ceil((recentAttempts[0] + RATE_LIMIT_WINDOW - now) / 1000)
    };
  }
  
  // Agregar nuevo intento
  recentAttempts.push(now);
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recentAttempts));
  
  return { allowed: true, remainingTime: 0 };
};

// Validaciones robustas para jugadas
export const validateJugada = (numeros) => {
  const errors = [];
  
  // Verificar que sean exactamente 6 números
  if (!Array.isArray(numeros) || numeros.length !== 6) {
    errors.push('Debe tener exactamente 6 números');
    return { isValid: false, errors };
  }
  
  // Verificar que todos sean números válidos
  const numerosValidos = numeros.every(num => {
    const n = parseInt(num);
    return !isNaN(n) && n >= 0 && n <= 45;
  });
  
  if (!numerosValidos) {
    errors.push('Todos los números deben estar entre 0 y 45');
  }
  
  // Verificar números únicos
  const numerosUnicos = new Set(numeros.map(n => parseInt(n)));
  if (numerosUnicos.size !== 6) {
    errors.push('Los números deben ser únicos');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitizar entrada de usuario
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9]/g, '').slice(0, 2);
};

// Validar timestamp para evitar manipulación
export const validateTimestamp = (timestamp) => {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  // Permitir hasta 1 hora de diferencia
  return diff <= 3600000;
};

// Captcha simple - verificación humana
export const generateCaptcha = () => {
  const operations = ['+', '-', '*'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a, b, answer;
  
  switch(op) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a - b;
      break;
    case '*':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
  }
  
  const captcha = {
    question: `${a} ${op} ${b} = ?`,
    answer
  };
  
  console.log('ValidationService: Captcha generado', captcha);
  return captcha;
};