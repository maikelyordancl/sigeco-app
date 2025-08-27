# --- ETAPA 1: Construcción (Builder) ---
FROM node:22-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos todas las dependencias
RUN npm install

# Copiamos el resto del proyecto
COPY . .

# Construimos la app Next.js para producción
RUN npm run build


# --- ETAPA 2: Producción (Runner) ---
FROM node:22-alpine AS runner

# Directorio de trabajo
WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copiamos archivos necesarios desde la etapa builder
#COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Usar usuario seguro
USER nextjs

# Exponer puerto por defecto de Next.js
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]