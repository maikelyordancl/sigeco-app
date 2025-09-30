import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './auth';

// Interceptor para refrescar el token
const refreshTokenInterceptor = async (url: string, options: RequestInit): Promise<Response> => {
    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshResponse.ok) {
                    const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
                    
                    setAccessToken(accessToken);
                    setRefreshToken(newRefreshToken);
                    
                    // Reintentar la solicitud original con el nuevo token
                    const newOptions = {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    };
                    response = await fetch(url, newOptions);
                } else {
                    clearTokens();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
            } catch (error) {
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        } else {
            clearTokens();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    }

    return response;
};


export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAccessToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await refreshTokenInterceptor(url, config);
    
    // Dejamos que los componentes manejen las respuestas no exitosas (ej. para leer mensajes de error)
    return response;
};

// --- FUNCIONES PARA PERMISOS Y ROLES ---

export const getRoles = () => apiFetch('/permisos/roles');

export const createRole = (name: string) => apiFetch('/permisos/roles', {
  method: 'POST',
  body: JSON.stringify({ name }),
});

export const assignUserRole = (userId: number, roleId: number) => apiFetch('/permisos/user-roles', {
  method: 'POST',
  body: JSON.stringify({ user_id: userId, role_id: roleId }),
});

export const removeUserRole = (userId: number, roleId: number) => apiFetch(`/permisos/user-roles?user_id=${userId}&role_id=${roleId}`, {
  method: 'DELETE',
});

export const getUserPermissionsByEvent = (userId: number) => apiFetch(`/permisos/event?user_id=${userId}`);

export const upsertUserPermission = (permission: any) => apiFetch('/permisos/event', {
  method: 'POST',
  body: JSON.stringify(permission),
});

export const deleteUserPermission = (userId: number, eventId: number, module: string) => apiFetch(`/permisos/event?user_id=${userId}&event_id=${eventId}&module=${module}`, {
  method: 'DELETE',
});

export const getUserSummary = (userId: number) => apiFetch(`/permisos/user/${userId}`);


// --- FUNCIONES PARA GESTIÓN DE USUARIOS (CRUD) ---

export const getUsuarios = () => apiFetch('/usuarios');

export const createUsuario = (usuarioData: { nombre: string; email: string; password?: string; role_id?: number }) => apiFetch('/usuarios', {
  method: 'POST',
  body: JSON.stringify(usuarioData),
});

export const updateUsuario = (id_usuario: number, usuarioData: { nombre: string; email: string; }) => apiFetch(`/usuarios/${id_usuario}`, {
  method: 'PUT',
  body: JSON.stringify(usuarioData),
});

export const deleteUsuario = (id_usuario: number) => apiFetch(`/usuarios/${id_usuario}`, {
  method: 'DELETE',
});

// Nota: Mantengo esta función `findUsers` porque la usamos en la UI para buscar. 
// Asegúrate de que tu backend tenga un endpoint como /api/usuarios/buscar?q=...
export const findUsers = (searchTerm: string) => apiFetch(`/usuarios?search=${searchTerm}`);