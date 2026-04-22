const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Safely parse — backend might return HTML on crash instead of JSON
        const contentType = response.headers.get('content-type') || '';
        let data: any;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            // If not JSON, create a readable error from the status
            if (!response.ok) {
                throw new Error(`Server error (${response.status}): ${response.statusText || 'Unexpected response from server'}`);
            }
            data = { message: text };
        }

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    }


    // Auth via Microsoft SSO
    // Sends the Microsoft ID token to our backend which verifies it and
    // auto-creates/finds the user, then returns our app's JWT.
    async ssoExchange(idToken: string) {
        return this.request<{ user: any; token: string }>('/api/auth/sso', {
            method: 'POST',
            body: { idToken },
        });
    }

    async getMe() {
        return this.request<{ user: any }>('/api/auth/me');
    }

    async updateProfile(data: { name?: string; department?: string; phone?: string }) {
        return this.request<{ user: any }>('/api/auth/profile', {
            method: 'PUT',
            body: data,
        });
    }

    // Inventory
    async getInventory(params?: { category?: string; search?: string }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request<{ items: any[]; categories: string[] }>(`/api/inventory${query ? `?${query}` : ''}`);
    }

    async getInventoryItem(id: string) {
        return this.request<{ item: any }>(`/api/inventory/${id}`);
    }

    async createInventoryItem(data: any) {
        return this.request<{ item: any }>('/api/inventory', {
            method: 'POST',
            body: data,
        });
    }

    async updateInventoryItem(id: string, data: any) {
        return this.request<{ item: any }>(`/api/inventory/${id}`, {
            method: 'PUT',
            body: data,
        });
    }

    async deleteInventoryItem(id: string) {
        return this.request<{ message: string }>(`/api/inventory/${id}`, {
            method: 'DELETE',
        });
    }

    // Requests
    async createRequest(data: { items: { inventoryItemId: string; quantity: number }[]; notes?: string; priority?: string }) {
        return this.request<{ request: any }>('/api/requests', {
            method: 'POST',
            body: data,
        });
    }

    async getRequests(status?: string) {
        const query = status ? `?status=${status}` : '';
        return this.request<{ requests: any[] }>(`/api/requests${query}`);
    }

    async getRequest(id: string) {
        return this.request<{ request: any }>(`/api/requests/${id}`);
    }

    async cancelRequest(id: string) {
        return this.request<{ message: string }>(`/api/requests/${id}`, {
            method: 'DELETE',
        });
    }

    // Tickets
    async createTicket(data: { subject: string; description: string; priority?: string }) {
        return this.request<{ ticket: any }>('/api/tickets', {
            method: 'POST',
            body: data,
        });
    }

    async getTickets(status?: string) {
        const query = status ? `?status=${status}` : '';
        return this.request<{ tickets: any[] }>(`/api/tickets${query}`);
    }

    async getTicket(id: string) {
        return this.request<{ ticket: any }>(`/api/tickets/${id}`);
    }

    // Notifications
    async getNotifications(unread?: boolean) {
        const query = unread ? '?unread=true' : '';
        return this.request<{ notifications: any[]; unreadCount: number }>(`/api/notifications${query}`);
    }

    async markNotificationRead(id: string) {
        return this.request<{ notification: any }>(`/api/notifications/${id}/read`, {
            method: 'PUT',
        });
    }

    async markAllNotificationsRead() {
        return this.request<{ message: string }>('/api/notifications/read-all', {
            method: 'PUT',
        });
    }

    // Admin
    async getAdminStats() {
        return this.request<{ stats: any; recentActivity: any[]; topItems: any[] }>('/api/admin/stats');
    }

    async getAdminRequests(params?: { status?: string; priority?: string; search?: string }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request<{ requests: any[] }>(`/api/admin/requests${query ? `?${query}` : ''}`);
    }

    async updateRequestStatus(id: string, data: { status: string; adminNotes?: string }) {
        return this.request<{ request: any }>(`/api/admin/requests/${id}/status`, {
            method: 'PUT',
            body: data,
        });
    }

    async getAdminTickets(params?: { status?: string; priority?: string }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request<{ tickets: any[] }>(`/api/admin/tickets${query ? `?${query}` : ''}`);
    }

    async updateTicketStatus(id: string, data: { status: string; resolution?: string }) {
        return this.request<{ ticket: any }>(`/api/admin/tickets/${id}/status`, {
            method: 'PUT',
            body: data,
        });
    }

    async getAdminLogs(params?: { entityType?: string; action?: string; limit?: number }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request<{ logs: any[] }>(`/api/admin/logs${query ? `?${query}` : ''}`);
    }

    async getAdminUsers() {
        return this.request<{ users: any[] }>('/api/admin/users');
    }

    async deleteUser(id: string) {
        return this.request<{ message: string }>(`/api/admin/users/${id}`, {
            method: 'DELETE',
        });
    }

    async sendNotification(data: { userId: string; title: string; message: string; type?: string }) {
        return this.request<{ notification: any }>('/api/admin/notifications', {
            method: 'POST',
            body: data,
        });
    }
}

export const api = new ApiClient();
export default api;
