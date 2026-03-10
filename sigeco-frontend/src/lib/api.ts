import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './auth';

// Candado para evitar que múltiples peticiones choquen al renovar el token
let refreshPromise: Promise<string | null> | null = null;

const refreshTokenInterceptor = async (url: string, options: RequestInit): Promise<Response> => {
    let response = await fetch(url, options);

    if (response.status === 401) {
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
            clearTokens();
            if (typeof window !== 'undefined') window.location.href = '/login';
            return response;
        }

        // Si no hay un refresco en curso, lo iniciamos
        if (!refreshPromise) {
            refreshPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            }).then(async (res) => {
                if (res.ok) {
                    const result = await res.json();
                    if (result.success && result.data) {
                        setAccessToken(result.data.accessToken);
                        setRefreshToken(result.data.refreshToken);
                        return result.data.accessToken; // Retornamos el nuevo token
                    }
                }
                // Si falla la respuesta
                clearTokens();
                if (typeof window !== 'undefined') window.location.href = '/login';
                return null;
            }).catch(() => {
                clearTokens();
                if (typeof window !== 'undefined') window.location.href = '/login';
                return null;
            }).finally(() => {
                // Liberamos el candado
                refreshPromise = null;
            });
        }

        // Esperamos a que el proceso de refresco (el actual o el que estaba en curso) termine
        const newAccessToken = await refreshPromise;

        if (newAccessToken) {
            // Reintentar la solicitud original de forma transparente con el nuevo token
            const newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newAccessToken}`,
                },
            };
            response = await fetch(url, newOptions);
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
    return response;
};

// ---- NUEVO: fetch específico para multipart/form-data (FormData) ----
export const apiFetchImage = async (
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken();
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

  const h = new Headers(options.headers || {});
  if (token && !h.has('Authorization')) {
    h.set('Authorization', `Bearer ${token}`);
  }
  if (h.has('Content-Type')) {
    h.delete('Content-Type');
  }

  const config: RequestInit = {
    method: options.method || 'POST',
    headers: h,
    body: formData,
    ...options,
  };

  config.body = formData;

  const response = await refreshTokenInterceptor(url, config);
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

export const updatePassword = (id_usuario: number, password: string) => apiFetch(`/usuarios/${id_usuario}/password`, {
  method: 'PUT',
  body: JSON.stringify({ password }),
});

export const deleteUsuario = (id_usuario: number) => apiFetch(`/usuarios/${id_usuario}`, {
  method: 'DELETE',
});

export const findUsers = (searchTerm: string) => apiFetch(`/usuarios?search=${searchTerm}`);