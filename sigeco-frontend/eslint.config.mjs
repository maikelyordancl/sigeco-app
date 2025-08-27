import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Añade este objeto para personalizar las reglas
  {
    rules: {
      // Permite el uso de 'any' sin que sea un error
      "@typescript-eslint/no-explicit-any": "warn", // Cambia 'error' a 'warn' o 'off'
      // Advierte sobre variables no usadas en lugar de dar error
      "@typescript-eslint/no-unused-vars": "warn", // Cambia 'error' a 'warn' o 'off'
      // Puedes añadir más reglas aquí si es necesario
    },
  },
];

export default eslintConfig;
