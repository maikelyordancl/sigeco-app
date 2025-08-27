// Almacena el token de acceso en memoria para mayor seguridad.
let accessToken: string | null = null;

export const setTokens = (newAccessToken: string, newRefreshToken: string) => {
    accessToken = newAccessToken;
    localStorage.setItem('refreshToken', newRefreshToken);
};

export const getAccessToken = () => accessToken;

export const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refreshToken');
    }
    return null;
};

export const clearTokens = () => {
    accessToken = null;
    localStorage.removeItem('refreshToken');
};

export const isAuthenticated = () => !!accessToken;