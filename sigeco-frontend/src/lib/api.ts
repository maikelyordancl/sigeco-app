import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Función para refrescar el token
const refreshToken = async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
        // No hay refresh token, no podemos hacer nada.
        clearTokens();
        window.location.href = '/login';
        return false;
    }

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
            // El refresh token es inválido o expiró en el backend
            clearTokens();
            window.location.href = '/login';
            return false;
        }
    } catch (error) {
        // Error de red
        clearTokens();
        window.location.href = '/login';
        return false;
    }
};


// Nuestro wrapper de fetch
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAccessToken();
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Usamos el constructor Headers para manejar los encabezados de forma segura
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Solo añadimos Content-Type si no es FormData y no está ya definido
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    // --- FIN DE LA CORRECCIÓN ---

    let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    // Si el token expiró (401), intentamos renovarlo
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            // Reintentamos la petición original con el nuevo token
            const newToken = getAccessToken();
            if (newToken) {
                headers.set('Authorization', `Bearer ${newToken}`);
            }
            response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        }
    }

    return response;
};