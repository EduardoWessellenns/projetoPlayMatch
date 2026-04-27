class AuthManager {
    constructor() {
        this.token = localStorage.getItem('fitmatch_token');
        this.user = JSON.parse(localStorage.getItem('fitmatch_user') || 'null');
        this.init();
    }

    init() {
        // Verificar autenticação em todas as páginas
        if (this.token) {
            this.validateToken();
        }
    }

    async validateToken() {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (!data.success) {
                this.logout();
                return false;
            }

            this.user = data.user;
            localStorage.setItem('fitmatch_user', JSON.stringify(this.user));
            return true;

        } catch (error) {
            console.error('Erro ao validar token:', error);
            this.logout();
            return false;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('fitmatch_token', this.token);
                localStorage.setItem('fitmatch_user', JSON.stringify(this.user));
                
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }

        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }

        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('fitmatch_token');
        localStorage.removeItem('fitmatch_user');
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Instância global
const authManager = new AuthManager();