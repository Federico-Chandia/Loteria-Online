# 🚀 Deployment Alternativo

## Opción 1: Deploy directo desde GitHub

1. **Sube tu código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/quini6-loteria.git
git push -u origin main
```

2. **Conecta con Vercel:**
- Ve a [vercel.com](https://vercel.com)
- Haz login con GitHub
- Click "New Project"
- Selecciona tu repositorio
- Vercel detectará automáticamente la configuración

## Opción 2: Build local y subir

1. **Build local:**
```bash
npm run build:vercel
```

2. **Sube la carpeta `dist` manualmente:**
- Ve a [vercel.com](https://vercel.com)
- Click "New Project"
- Arrastra la carpeta `dist` generada

## Opción 3: Usar Yarn en lugar de NPM

```bash
# Instalar yarn si no lo tienes
npm install -g yarn

# Instalar Vercel con yarn
yarn global add vercel

# Login y deploy
vercel login
vercel --prod
```

## Configuración automática incluida:
- ✅ `vercel.json` configurado
- ✅ Scripts de build listos
- ✅ Web Workers en `/public/workers/`
- ✅ SPA routing configurado