const API_URL = 'https://flixview-api.flixview.workers.dev'; // Hardcoded to ensure correct endpoint

type RequestMethod = 'GET' | 'POST' | 'DELETE' | 'PUT';

async function request<T>(endpoint: string, method: RequestMethod = 'GET', body?: any, token?: string): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let errorData: any;
        try {
            const text = await response.text();
            try {
                errorData = JSON.parse(text);
            } catch {
                errorData = { error: text || 'Unknown error' };
            }
        } catch {
            errorData = { error: 'Failed to read error response' };
        }
        if (response.status >= 500) {
            console.error(`API Error [${method} ${endpoint}] ${response.status}:`, JSON.stringify(errorData));
        } else {
            console.warn(`API Warn [${method} ${endpoint}] ${response.status}:`, JSON.stringify(errorData));
        }

        const errorMessage = typeof errorData?.error === 'object'
            ? JSON.stringify(errorData.error)
            : (errorData?.error || (errorData?.success === false && JSON.stringify(errorData?.result)) || JSON.stringify(errorData));

        if (response.status === 401) {
            // Dispatch event for AuthContext to handle logout
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth:unauthorized'));
            }
        }

        throw new Error(`${response.status}: ${errorMessage || 'Request failed'}`);
    }

    return response.json();
}

export const api = {
    auth: {
        register: (email: string, username: string, password: string) =>
            request<{ message: string; userId: string }>('/auth/register', 'POST', { email, username, password }),
        login: (email: string, password: string) =>
            request<{ token: string; user: { id: string; email: string; username: string; profilePicture?: string | null } }>('/auth/login', 'POST', { email, password }),
        updateProfile: (token: string, data: { username?: string; password?: string; profilePicture?: string | null }) =>
            request<{ user: { id: string; email: string; username: string; profilePicture?: string | null } }>('/api/user', 'PUT', data, token),
    },
    sync: {
        getData: (token: string) =>
            request<{ progress: any[]; watchlist: any[]; favorites: any[] }>('/api/sync', 'GET', undefined, token),
    },
    progress: {
        upsert: (token: string, data: any) =>
            request<{ success: boolean }>('/api/progress', 'POST', data, token),
    },
    list: {
        add: (token: string, item: any) =>
            request<{ success: boolean }>('/api/list', 'POST', item, token),
        remove: (token: string, item: { mediaId: string; mediaType: string; listType: string }) =>
            request<{ success: boolean }>('/api/list', 'DELETE', item, token),
    }
};
