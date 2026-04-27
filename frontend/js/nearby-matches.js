// js/nearby-matches.js

let userLocation = null;
let allMatches = [];
let filteredMatches = [];
let isLocationLoading = false;

// INICIALIZAR PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    loadNearbyMatches();
});

// CARREGAR PARTIDAS PRÓXIMAS
function loadNearbyMatches() {
    if (isLocationLoading) {
        console.log('Busca de localização já em andamento...');
        return;
    }
    
    isLocationLoading = true;
    showLoading('🗺️ Obtendo sua localização...');
    
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // 15 segundos
            maximumAge: 300000 // 5 minutos de cache
        };
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                isLocationLoading = false;
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log('Localização obtida:', userLocation);
                updateLocationInfo(userLocation);
                findNearbyMatches();
            },
            function(error) {
                isLocationLoading = false;
                console.error('Erro na geolocalização:', error);
                handleLocationError(error);
            },
            options
        );
    } else {
        isLocationLoading = false;
        handleLocationError(new Error('Geolocalização não suportada'));
    }
}

// ATUALIZAR INFORMAÇÕES DE LOCALIZAÇÃO
function updateLocationInfo(location) {
    const locationText = document.getElementById('locationText');
    locationText.innerHTML = `
        <strong>Lat:</strong> ${location.lat.toFixed(4)}, 
        <strong>Lng:</strong> ${location.lng.toFixed(4)}
    `;
    
    // Buscar endereço aproximado (opcional)
    fetchAddressFromCoordinates(location.lat, location.lng)
        .then(address => {
            if (address) {
                locationText.innerHTML = address;
            }
        })
        .catch(error => {
            console.log('Endereço não disponível, usando coordenadas');
        });
}

// BUSCAR ENDEREÇO DAS COORDENADAS (COM TIMEOUT)
function fetchAddressFromCoordinates(lat, lng) {
    return new Promise((resolve, reject) => {
        // Timeout para evitar espera infinita
        const timeout = setTimeout(() => {
            reject(new Error('Timeout ao buscar endereço'));
        }, 5000);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`)
            .then(response => {
                clearTimeout(timeout);
                return response.json();
            })
            .then(data => {
                if (data && data.display_name) {
                    const address = data.display_name.split(',').slice(0, 3).join(',');
                    resolve(address);
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

// ENCONTRAR PARTIDAS PRÓXIMAS
function findNearbyMatches() {
    showLoading('🔍 Buscando partidas próximas...');
    
    // Simular busca com delay (substitua por API real depois)
    setTimeout(() => {
        // Buscar partidas do localStorage ou gerar partidas de exemplo
        const storedMatches = JSON.parse(localStorage.getItem('playmatch_matches') || '[]');
        
        if (storedMatches.length > 0) {
            // Usar partidas reais do sistema
            allMatches = storedMatches.filter(match => 
                new Date(match.dateTime) > new Date() // Apenas partidas futuras
            );
        } else {
            // Gerar partidas de exemplo
            allMatches = generateSampleMatches();
        }
        
        // Calcular distâncias e ordenar
        allMatches.forEach(match => {
            match.distance = calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                match.venue.lat, 
                match.venue.lng
            );
        });
        
        // Ordenar por proximidade
        allMatches.sort((a, b) => a.distance - b.distance);
        
        hideLoading();
        
        // Aplicar filtros iniciais
        filterMatches();
        
    }, 1000); // Reduzido para 1 segundo
}

// GERAR PARTIDAS DE EXEMPLO (para demonstração)
function generateSampleMatches() {
    const sports = ['Futebol', 'Basquete', 'Vôlei', 'Tênis', 'Futsal'];
    const matches = [];
    
    // Gerar 8-12 partidas de exemplo em locais próximos
    const numberOfMatches = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < numberOfMatches; i++) {
        // Gerar localização aleatória dentro de 15km
        const radius = 15;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius;
        
        const lat = userLocation.lat + (distance / 111.32) * Math.cos(angle);
        const lng = userLocation.lng + (distance / (111.32 * Math.cos(userLocation.lat * Math.PI / 180))) * Math.sin(angle);
        
        const sport = sports[Math.floor(Math.random() * sports.length)];
        const playersCount = Math.floor(Math.random() * 8) + 6; // 6-14 jogadores
        const availableSpots = Math.floor(Math.random() * (playersCount - 2)) + 2;
        
        // Data aleatória nos próximos 7 dias
        const randomDays = Math.floor(Math.random() * 7);
        const matchDate = new Date();
        matchDate.setDate(matchDate.getDate() + randomDays);
        matchDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
        
        matches.push({
            id: `sample_${Date.now()}_${i}`,
            venue: {
                name: `Quadra ${getRandomVenueName()} ${sport}`,
                sport: sport,
                lat: lat,
                lng: lng,
                type: sport === 'Futebol' ? 'Campo' : 'Quadra',
                hasLights: Math.random() > 0.3,
                isFree: Math.random() > 0.5
            },
            sport: sport,
            dateTime: matchDate.toISOString(),
            playersCount: playersCount,
            availableSpots: availableSpots,
            description: getRandomDescription(sport),
            status: 'disponivel',
            created: new Date().toISOString(),
            participants: [
                {
                    id: 999,
                    name: 'Organizador ' + (i + 1),
                    email: `org${i + 1}@email.com`
                }
            ],
            creator: {
                id: 999,
                name: 'Organizador ' + (i + 1)
            }
        });
    }
    
    return matches;
}

// TRATAMENTO DE ERROS DE LOCALIZAÇÃO MELHORADO
function handleLocationError(error) {
    console.error('Erro de localização:', error);
    
    let errorMessage = 'Não foi possível obter sua localização. ';
    
    if (error.code === error.PERMISSION_DENIED) {
        errorMessage += 'Permissão de localização negada. ';
    } else if (error.code === error.TIMEOUT) {
        errorMessage += 'Tempo esgotado. ';
    } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage += 'Localização indisponível. ';
    }
    
    errorMessage += 'Usando localização padrão (São Paulo).';
    
    showLoading(errorMessage);
    
    // Usar localização padrão após breve delay
    setTimeout(() => {
        userLocation = { lat: -23.5505, lng: -46.6333 };
        updateLocationInfo(userLocation);
        findNearbyMatches();
    }, 2000);
}

// FILTRAR PARTIDAS
function filterMatches() {
    if (!userLocation) {
        console.log('Aguardando localização...');
        return;
    }
    
    const sportFilter = document.getElementById('sportFilter').value;
    const distanceFilter = parseInt(document.getElementById('distanceFilter').value);
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredMatches = allMatches.filter(match => {
        // Filtro de esporte
        if (sportFilter !== 'all' && match.sport !== sportFilter) {
            return false;
        }
        
        // Filtro de distância
        if (match.distance > distanceFilter) {
            return false;
        }
        
        // Filtro de data
        if (dateFilter !== 'all') {
            const matchDate = new Date(match.dateTime);
            const today = new Date();
            
            switch(dateFilter) {
                case 'today':
                    if (matchDate.toDateString() !== today.toDateString()) return false;
                    break;
                case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    if (matchDate.toDateString() !== tomorrow.toDateString()) return false;
                    break;
                case 'weekend':
                    const dayOfWeek = matchDate.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) return false;
                    break;
            }
        }
        
        return true;
    });
    
    displayMatches();
}

// EXIBIR PARTIDAS
function displayMatches() {
    const matchesList = document.getElementById('matchesList');
    
    if (filteredMatches.length === 0) {
        matchesList.innerHTML = `
            <div class="empty-state">
                <h3>😔 Nenhuma partida encontrada</h3>
                <p>Não encontramos partidas disponíveis com os filtros selecionados.</p>
                <div style="margin-top: 15px;">
                    <button onclick="resetFilters()" class="btn-join" style="margin: 5px;">
                        🔄 Limpar Filtros
                    </button>
                    <button onclick="refreshMatches()" class="btn-details" style="margin: 5px;">
                        🔁 Buscar Novamente
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    matchesList.innerHTML = '';
    
    filteredMatches.forEach(match => {
        const matchCard = createMatchCard(match);
        matchesList.appendChild(matchCard);
    });
}

// CRIAR CARTÃO DE PARTIDA
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const matchDate = new Date(match.dateTime);
    const isToday = new Date().toDateString() === matchDate.toDateString();
    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === matchDate.toDateString();
    
    card.innerHTML = `
        <div class="match-header">
            <div class="match-sport">${getSportIcon(match.sport)} ${match.sport}</div>
            <div class="match-distance">📍 ${match.distance.toFixed(1)} km</div>
        </div>
        
        <div class="match-details">
            <div><strong>🏟️ Local:</strong> ${match.venue.name}</div>
            <div>
                <strong>📅 Data:</strong> ${formatDateTime(match.dateTime)} 
                ${isToday ? '<span style="color: #28a745; font-weight: bold;">(Hoje)</span>' : ''}
                ${isTomorrow ? '<span style="color: #ffc107; font-weight: bold;">(Amanhã)</span>' : ''}
            </div>
            
            <div class="match-info">
                <div class="info-item">
                    👥 <strong>Vagas:</strong> ${match.availableSpots}/${match.playersCount}
                </div>
                <div class="info-item">
                    ${match.venue.hasLights ? '💡 Iluminada' : '🌙 Sem luz'}
                </div>
                <div class="info-item">
                    ${match.venue.isFree ? '🆓 Gratuita' : '💲 Paga'}
                </div>
            </div>
            
            ${match.description ? `<div style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px;"><strong>📝:</strong> ${match.description}</div>` : ''}
        </div>
        
        <div class="match-actions">
            <button onclick="joinMatch('${match.id}')" class="btn-join" ${match.availableSpots === 0 ? 'disabled style="background: #6c757d; cursor: not-allowed;"' : ''}>
                ✅ Participar ${match.availableSpots > 0 ? `(${match.availableSpots} vaga${match.availableSpots > 1 ? 's' : ''})` : '(Lotada)'}
            </button>
            <button onclick="viewMatchDetails('${match.id}')" class="btn-details">
                👀 Detalhes
            </button>
        </div>
    `;
    
    return card;
}

// PARTICIPAR DE PARTIDA
function joinMatch(matchId) {
    const match = allMatches.find(m => m.id === matchId);
    
    if (!match) {
        alert('Partida não encontrada.');
        return;
    }
    
    if (match.availableSpots === 0) {
        alert('Esta partida já está lotada.');
        return;
    }
    
    const userData = JSON.parse(localStorage.getItem('fitmatch_user'));
    if (!userData) {
        alert('Você precisa estar logado para participar de uma partida.');
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar se já está participando
    const alreadyParticipating = match.participants.some(p => p.id === userData.id);
    if (alreadyParticipating) {
        alert('Você já está participando desta partida!');
        return;
    }
    
    if (confirm(`Deseja participar da partida de ${match.sport}?\n\nLocal: ${match.venue.name}\nData: ${formatDateTime(match.dateTime)}`)) {
        // Adicionar usuário como participante
        match.participants.push({
            id: userData.id,
            name: userData.name || userData.username,
            email: userData.email
        });
        
        match.availableSpots = match.playersCount - match.participants.length;
        
        // Atualizar no localStorage
        updateMatchInStorage(match);
        
        alert(`✅ Você entrou na partida de ${match.sport}!\n\nNão se esqueça da data: ${formatDateTime(match.dateTime)}`);
        
        // Atualizar lista
        filterMatches();
        
        // Atualizar estatísticas do usuário
        updateUserStats();
    }
}

// ATUALIZAR PARTIDA NO STORAGE
function updateMatchInStorage(updatedMatch) {
    let matches = JSON.parse(localStorage.getItem('playmatch_matches') || '[]');
    const index = matches.findIndex(m => m.id === updatedMatch.id);
    
    if (index !== -1) {
        matches[index] = updatedMatch;
    } else {
        matches.push(updatedMatch);
    }
    
    localStorage.setItem('playmatch_matches', JSON.stringify(matches));
    
    // Atualizar também no array local
    const localIndex = allMatches.findIndex(m => m.id === updatedMatch.id);
    if (localIndex !== -1) {
        allMatches[localIndex] = updatedMatch;
    }
}

// ATUALIZAR ESTATÍSTICAS DO USUÁRIO
function updateUserStats() {
    const userData = JSON.parse(localStorage.getItem('fitmatch_user'));
    if (userData) {
        const userProfileKey = `fitmatch_user_profile_${userData.id}`;
        const profile = JSON.parse(localStorage.getItem(userProfileKey) || '{}');
        
        profile.matchesPlayed = (profile.matchesPlayed || 0) + 1;
        localStorage.setItem(userProfileKey, JSON.stringify(profile));
    }
}

// VER DETALHES DA PARTIDA
function viewMatchDetails(matchId) {
    const match = allMatches.find(m => m.id === matchId);
    
    if (match) {
        const matchDate = new Date(match.dateTime);
        const participantsList = match.participants.map(p => `• ${p.name}`).join('\n');
        
        alert(`
🎯 DETALHES DA PARTIDA:

🏆 Esporte: ${match.sport}
🏟️ Local: ${match.venue.name}
📍 Distância: ${match.distance.toFixed(1)} km
📅 Data: ${formatDateTime(match.dateTime)}
👥 Vagas: ${match.availableSpots}/${match.playersCount}

💡 Iluminação: ${match.venue.hasLights ? 'Sim' : 'Não'}
💰 Valor: ${match.venue.isFree ? 'Gratuita' : 'Paga'}
🎾 Tipo: ${match.venue.type}

👤 Organizador: ${match.creator.name}

📝 Descrição:
${match.description || 'Nenhuma descrição fornecida'}

👥 Participantes:
${participantsList || 'Ainda não há participantes'}
        `);
    }
}

// FUNÇÕES AUXILIARES
function getSportIcon(sport) {
    const icons = {
        'Futebol': '⚽',
        'Basquete': '🏀',
        'Vôlei': '🏐',
        'Futsal': '👟'
    };
    return icons[sport] || '🏆';
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function showLoading(message) {
    const matchesList = document.getElementById('matchesList');
    matchesList.innerHTML = `
        <div class="loading">
            <div style="font-size: 2em; margin-bottom: 10px;">⏳</div>
            ${message}
        </div>
    `;
}

function hideLoading() {
    // Loading é escondido quando as partidas são exibidas
}

function refreshLocation() {
    if (isLocationLoading) {
        alert('Busca de localização já em andamento...');
        return;
    }
    loadNearbyMatches();
}

function refreshMatches() {
    if (!userLocation) {
        loadNearbyMatches();
        return;
    }
    
    if (isLocationLoading) {
        alert('Aguarde a localização atual...');
        return;
    }
    
    findNearbyMatches();
}

function resetFilters() {
    document.getElementById('sportFilter').value = 'all';
    document.getElementById('distanceFilter').value = '10';
    document.getElementById('dateFilter').value = 'all';
    filterMatches();
}

// NOMES ALEATÓRIOS PARA QUADRAS
function getRandomVenueName() {
    const names = ['Municipal', 'Esportiva', 'Comunitária', 'do Parque', 'do Clube', 'Universitária', 'Central', 'Esporte'];
    return names[Math.floor(Math.random() * names.length)];
}

// DESCRIÇÕES ALEATÓRIAS
function getRandomDescription(sport) {
    const descriptions = [
        `Partida amistosa de ${sport}, todos são bem-vindos!`,
        `Jogo casual de ${sport}, trazer seu próprio equipamento.`,
        `${sport} recreativo, vamos nos divertir!`,
        `Partida de ${sport}, nível intermediário.`,
        `Jogo de ${sport} para fazer novos amigos!`,
        `Grupo fixo de ${sport}, sempre às quartas!`,
        `${sport} sem compromisso, venha relaxar!`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}