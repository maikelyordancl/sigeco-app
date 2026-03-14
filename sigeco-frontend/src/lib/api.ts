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
            const headers = new Headers(options.headers || {});
            headers.set('Authorization', `Bearer ${newAccessToken}`);

            const newOptions: RequestInit = {
                ...options,
                headers,
            };

            response = await fetch(url, newOptions);
        }
    }

    return response;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAccessToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Solo seteamos JSON si NO es FormData
    if (!isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // Si es FormData, JAMÁS forzar Content-Type
    if (isFormData && headers.has('Content-Type')) {
        headers.delete('Content-Type');
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await refreshTokenInterceptor(url, config);
    return response;
};

// ---- fetch específico para multipart/form-data (FormData) ----
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
    ...options,
    method: options.method || 'POST',
    headers: h,
    body: formData,
  };

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