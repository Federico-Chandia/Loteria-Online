# Quini 6 Lotería App

Aplicación de lotería Quini 6 con seguridad avanzada y blockchain local.

## 🚀 Deploy en Vercel

### Pasos para deployment:

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login en Vercel:**
```bash
vercel login
```

3. **Deploy desde el directorio del proyecto:**
```bash
vercel --prod
```

### Configuración automática:
- ✅ `vercel.json` configurado
- ✅ Scripts de build optimizados
- ✅ Web Workers en `/public/workers/`
- ✅ Routing SPA configurado

## 🔧 Scripts disponibles:

- `npm start` - Desarrollo con Expo
- `npm run web` - Web development
- `npm run build` - Build para producción
- `npm run build:vercel` - Build optimizado para Vercel

## 🛡️ Características de seguridad:

- Blockchain local inmutable
- Firmas digitales ECDSA
- Encriptación AES-GCM
- Protección anti-replay
- Rate limiting
- Captcha de verificación

## 📱 Funcionalidades:

- Jugar Quini 6 (modalidades: Tradicional, La Segunda, Revancha, Siempre Sale)
- Historial de jugadas encriptado
- Verificación de premios
- Resultados en tiempo real
- Interfaz responsive