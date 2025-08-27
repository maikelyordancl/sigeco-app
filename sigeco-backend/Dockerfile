# Usamos una imagen oficial de Node.js (versión 22-alpine) como base.
FROM node:22-alpine

# Establecemos el directorio de trabajo dentro del contenedor a /app.
WORKDIR /app

# Copiamos package.json y package-lock.json (si existe) al directorio de trabajo.
COPY package*.json ./

# Instalamos las dependencias del proyecto.
# Usamos --only=production para instalar solo las dependencias necesarias en producción.
RUN npm install --only=production

# Copiamos el resto de los archivos de la aplicación al directorio de trabajo.
COPY . .

# Exponemos el puerto 8000, que es el que utiliza tu servidor Express.
EXPOSE 8000

# El comando por defecto que se ejecutará cuando el contenedor se inicie.
CMD [ "node", "server.js" ]