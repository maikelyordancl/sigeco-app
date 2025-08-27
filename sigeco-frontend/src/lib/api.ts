import { jwtDecode } from 'jwt-decode';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Variable para evitar múltiples peticiones de refresco simultáneas
let isRefreshing = false;

// Función para refrescar el token
const refreshToken = async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
        clearTokens();
        // Solo redirigimos si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return false;
    }

    // Evita que múltiples llamadas a la API intenten refrescar el token al mismo tiempo
    if (isRefreshing) {
        // Espera a que la promesa de refresco en curso se resuelva
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (!isRefreshing) {
                    clearInterval(interval);
                    resolve(!!getAccessToken());
                }
            }, 100);
        });
    }

    isRefreshing = true;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });

        const result = await response.json();

        if (result.success && result.data.accessToken && result.data.refreshToken) {
            setTokens(result.data.accessToken, result.data.refreshToken);
            return true;
        } else {
            clearTokens();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return false;
        }
    } catch (error) {
        clearTokens();
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return false;
    } finally {
        isRefreshing = false;
    }
};

// Nueva función para verificar y refrescar el token si es necesario
const ensureValidToken = async (): Promise<string | null> => {
    let token = getAccessToken();

    if (token) {
        try {
            const decoded: { exp: number } = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            // Refrescar si el token expira en la próxima hora (3600 segundos)
            if (decoded.exp < currentTime + 3600) {
                const refreshed = await refreshToken();
                if (refreshed) {
                    token = getAccessToken();
                } else {
                    token = null; // No se pudo refrescar, se anula el token
                }
            }
        } catch (error) {
            console.error("Token inválido, intentando refrescar...", error);
            const refreshed = await refreshToken();
            token = refreshed ? getAccessToken() : null;
        }
    } else if (getRefreshToken()) {
        // Si no hay accessToken pero sí refreshToken (ej. al recargar la página)
        const refreshed = await refreshToken();
        token = refreshed ? getAccessToken() : null;
    }
    
    return token;
}


// Nuestro wrapper de fetch mejorado
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = await ensureValidToken();

    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    // Mantenemos esto como un fallback por si el token expira entre la verificación y la llamada
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            const newToken = getAccessToken();
             if (newToken) {
                headers.set('Authorization', `Bearer ${newToken}`);
            }
            return fetch(`${API_URL}${endpoint}`, { ...options, headers });
        }
    }

    return response;
};