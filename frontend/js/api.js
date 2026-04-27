class FitMatchAPI {
    constructor() {
        this.baseURL = '/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: authManager.getAuthHeaders()
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Matches
    async getMatches() {
        return await this.request('/matches');
    }

    async getMatch(id) {
        return await this.request(`/matches/${id}`);
    }

    async createMatch(matchData) {
        return await this.request('/matches', {
            method: 'POST',
            body: JSON.stringify(matchData)
        });
    }

    async participateInMatch(matchId, role = 'jogador') {
        return await this.request(`/matches/${matchId}/participate`, {
            method: 'POST',
            body: JSON.stringify({ role })
        });
    }

    async cancelParticipation(matchId) {
        return await this.request(`/matches/${matchId}/participate`, {
            method: 'DELETE'
        });
    }

    async getMyMatches() {
        return await this.request('/matches/user/my-matches');
    }

    // Users
    async getProfile() {
        return await this.request('/users/profile');
    }

    async updateProfile(profileData) {
        return await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getSports() {
        return await this.request('/users/sports');
    }

    // Locations
    async getNearbyVenues(lat, lng, radius = 5, filters = {}) {
        const params = new URLSearchParams({
            lat, lng, radius, ...filters
        });
        return await this.request(`/locations/venues?${params}`);
    }

    async searchAddress(address) {
        return await this.request('/locations/geocode', {
            method: 'POST',
            body: JSON.stringify({ address })
        });
    }

    // Ratings
    async rateUser(ratingData) {
        return await this.request('/ratings', {
            method: 'POST',
            body: JSON.stringify(ratingData)
        });
    }

    async getUserRatings(userId) {
        return await this.request(`/ratings/user/${userId}`);
    }
}

// Instância global
const fitMatchAPI = new FitMatchAPI();