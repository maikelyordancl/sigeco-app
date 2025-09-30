import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
};

export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

export const getRefreshToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  };

export const setRefreshToken = (token: string): void => {
if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
}
};

export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Decodifica el token de acceso para obtener el rol del usuario.
 * @returns El rol del usuario (ej. "SUPER_ADMIN") o null si no se encuentra.
 */
export const getUserRole = (): string | null => {
  const token = getAccessToken();
  if (!token) {
    console.log("No se encontró token de acceso.");
    return null;
  }
  try {
    // Definimos la estructura esperada del payload del token
    const decoded: { role: string } = jwtDecode(token);
    // Devolvemos el rol encontrado
    return decoded.role;
  } catch (error) {
    console.error("Error decodificando el token:", error);
    return null;
  }
};