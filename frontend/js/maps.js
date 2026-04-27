// js/maps.js
let map;
let modalMap;
let userMarker;
let selectedLocation = null;
let selectedMarker = null;
let isMapInitialized = false;
let isModalMapInitialized = false;

// Obter localização PRECISA do usuário
function getUserLocation() {
    showLoading('📍 Obtendo sua localização precisa...');
    
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true, // Alta precisão
            timeout: 10000, // 10 segundos
            maximumAge: 0 // Não usar cache
        };
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log('Localização obtida:', userLatLng);
                console.log('Precisão:', position.coords.accuracy + ' metros');
                
                // Inicializar e mostrar mapa principal
                initAndShowMap(userLatLng);
                
                // Buscar locais próximos
                findNearbyVenues(userLatLng);
            },
            function(error) {
                console.error('Erro na geolocalização:', error);
                hideLoading();
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        alert('Permissão de localização negada. Por favor, permita o acesso à localização.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert('Localização indisponível. Tente novamente.');
                        break;
                    case error.TIMEOUT:
                        alert('Tempo esgotado para obter localização. Tente novamente.');
                        break;
                    default:
                        alert('Erro ao obter localização: ' + error.message);
                }
            },
            options
        );
    } else {
        alert('Geolocalização não suportada pelo navegador.');
        hideLoading();
    }
}

// Criar partida em local específico
function createMatchAtLocation() {
    showLoading('📍 Obtendo sua localização para criar partida...');
    
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                hideLoading();
                openLocationModal(userLatLng);
            },
            function(error) {
                console.error('Erro na geolocalização:', error);
                hideLoading();
                alert('Erro ao obter localização: ' + error.message);
            },
            options
        );
    } else {
        alert('Geolocalização não suportada pelo navegador.');
        hideLoading();
    }
}

// Inicializar e mostrar mapa principal
function initAndShowMap(centerLatLng) {
    // Esconder mensagem inicial
    document.getElementById('initialMessage').style.display = 'none';
    
    // Mostrar container do mapa
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.style.display = 'block';
    
    // Inicializar mapa se não foi inicializado
    if (!isMapInitialized) {
        map = L.map('map').setView([centerLatLng.lat, centerLatLng.lng], 16); // Zoom mais próximo
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Adicionar clique no mapa principal
        map.on('click', function(e) {
            selectLocation(e.latlng, map);
        });
        
        isMapInitialized = true;
    } else {
        // Se já inicializado, apenas centralizar
        map.setView([centerLatLng.lat, centerLatLng.lng], 16);
    }
    
    // Adicionar marcador da localização do usuário
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    userMarker = L.marker([centerLatLng.lat, centerLatLng.lng])
        .addTo(map)
        .bindPopup('📍 Sua localização atual')
        .openPopup();
    
    // Adicionar círculo de precisão
    L.circle([centerLatLng.lat, centerLatLng.lng], {
        color: 'blue',
        fillColor: '#1e90ff',
        fillOpacity: 0.1,
        radius: 50 // Raio de 50 metros para indicar precisão
    }).addTo(map);
}

// Abrir modal de localização
function openLocationModal(userLatLng) {
    document.getElementById('locationModal').style.display = 'flex';
    
    // Inicializar mapa modal
    setTimeout(() => {
        if (!isModalMapInitialized) {
            modalMap = L.map('modalMap').setView([userLatLng.lat, userLatLng.lng], 16);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(modalMap);
            
            // Adicionar clique no mapa modal
            modalMap.on('click', function(e) {
                selectLocation(e.latlng, modalMap);
                updateSelectedLocationInfo(e.latlng);
            });
            
            isModalMapInitialized = true;
        } else {
            modalMap.setView([userLatLng.lat, userLatLng.lng], 16);
        }
        
        // Adicionar marcador da localização atual no modal
        L.marker([userLatLng.lat, userLatLng.lng])
            .addTo(modalMap)
            .bindPopup('Sua localização atual')
            .openPopup();
            
        // Selecionar localização atual por padrão
        selectLocation(userLatLng, modalMap);
        updateSelectedLocationInfo(userLatLng);
        
        modalMap.invalidateSize();
    }, 100);
}

// Selecionar localização
function selectLocation(latlng, currentMap) {
    selectedLocation = latlng;
    
    // Remover marcador anterior se existir
    if (selectedMarker) {
        currentMap.removeLayer(selectedMarker);
    }
    
    // Adicionar novo marcador
    selectedMarker = L.marker(latlng).addTo(currentMap)
        .bindPopup('📍 Local selecionado')
        .openPopup();
    
    // Habilitar botão de confirmação no modal
    if (currentMap === modalMap) {
        document.getElementById('confirmBtn').disabled = false;
    }
}

// Atualizar informações do local selecionado
function updateSelectedLocationInfo(latlng) {
    const infoDiv = document.getElementById('selectedLocationInfo');
    infoDiv.innerHTML = `
        <strong>Latitude:</strong> ${latlng.lat.toFixed(6)}<br>
        <strong>Longitude:</strong> ${latlng.lng.toFixed(6)}<br>
        <em style="color: green;">✅ Localização precisa</em>
    `;
}

// Buscar locais próximos (simulação)
function findNearbyVenues(userLatLng) {
    const venueList = document.getElementById('venueList');
    
    // Simulação de busca com delay
    setTimeout(() => {
        const venues = [
            { name: "Quadra Poliesportiva", sport: "Futebol", distance: "0.2km" },
            { name: "Clube da Cidade", sport: "Basquete", distance: "0.5km" },
            { name: "Parque Municipal", sport: "Vôlei", distance: "0.3km" },
            { name: "Academia Esportiva", sport: "Tênis", distance: "0.7km" }
        ];
        
        venueList.innerHTML = '';
        
        venues.forEach(venue => {
            const venueItem = document.createElement('div');
            venueItem.className = 'venue-item';
            venueItem.innerHTML = `
                <div>
                    <span class="venue-name">${venue.name}</span>
                    <span class="venue-sport">${venue.sport}</span>
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    📍 ${venue.distance} de distância
                </div>
            `;
            
            venueItem.onclick = function() {
                alert(`Local selecionado: ${venue.name}`);
            };
            
            venueList.appendChild(venueItem);
        });
    }, 1500); // Simula tempo de busca
}

// Buscar por endereço
function searchByAddress() {
    const addressInput = document.getElementById('addressInput').value;
    
    if (!addressInput) {
        alert('Por favor, digite um endereço.');
        return;
    }
    
    showLoading('🔍 Buscando endereço...');
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (data && data.length > 0) {
                const result = data[0];
                const latLng = {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
                
                // Centralizar mapa no endereço encontrado
                if (map) {
                    map.setView([latLng.lat, latLng.lng], 16);
                    
                    // Adicionar marcador
                    L.marker([latLng.lat, latLng.lng])
                        .addTo(map)
                        .bindPopup(`<b>${result.display_name}</b>`)
                        .openPopup();
                    
                    // Buscar locais próximos
                    findNearbyVenues(latLng);
                }
            } else {
                alert('Endereço não encontrado.');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Erro na busca:', error);
            alert('Erro ao buscar endereço.');
        });
}

// Fechar modal
function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    selectedLocation = null;
}

// Confirmar local selecionado
function confirmLocation() {
    if (selectedLocation) {
        console.log('Local confirmado:', selectedLocation);
        
        alert(`✅ Partida criada no local!\n\nLat: ${selectedLocation.lat.toFixed(6)}\nLng: ${selectedLocation.lng.toFixed(6)}`);
        
        closeLocationModal();
        
        // Mostrar no mapa principal também
        if (map) {
            initAndShowMap(selectedLocation);
            selectLocation(selectedLocation, map);
        }
    }
}

// Funções auxiliares de loading
function showLoading(message) {
    const loadingElement = document.getElementById('loadingMessage');
    if (loadingElement) {
        loadingElement.innerHTML = message || '🔄 Carregando...';
        loadingElement.style.display = 'block';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loadingMessage');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Inicialização básica quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('PlayMatch - Mapa carregado');
    // Mapa não é inicializado até o usuário clicar em uma ação
});

// MOSTRAR TODAS AS QUADRAS DA CIDADE
function showAllCityVenues(centerLatLng) {
    // Limpar marcadores anteriores
    clearAllVenuesMarkers();
    
    // Simulação de TODAS as quadras da cidade
    // Na prática, você buscaria isso do seu banco de dados
    const allCityVenues = generateAllCityVenues(centerLatLng);
    
    const venueList = document.getElementById('venueList');
    venueList.innerHTML = '<div class="loading">🏟️ Carregando todas as quadras da cidade...</div>';
    
    // Pequeno delay para simular carregamento
    setTimeout(() => {
        venueList.innerHTML = '';
        
        allCityVenues.forEach((venue, index) => {
            // Adicionar marcador no mapa
            addVenueToMap(venue);
            
            // Adicionar na lista
            addVenueToList(venue, index);
        });
        
        // Ajustar zoom para mostrar todas as quadras
        if (allCityVenues.length > 0 && map) {
            const group = new L.featureGroup(allVenuesMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
        
    }, 1000);
}
// js/maps.js
// ... (código anterior mantido)

// MODAL PARA CONFIRMAR LOCALIZAÇÃO
function createLocationConfirmationModal() {
    // Remover modal existente se houver
    const existingModal = document.getElementById('locationConfirmationModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Criar modal
    const modalHTML = `
        <div id="locationConfirmationModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 450px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="color: #2c5530; margin-bottom: 15px;">📍 Confirmar Localização</h3>
                
                <div id="locationDetails" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="font-size: 1.2em; margin-right: 10px;">🎯</div>
                        <div>
                            <strong>Sua localização exata:</strong>
                            <div id="exactCoordinates" style="font-family: monospace; color: #666; margin-top: 5px;">
                                Calculando...
                            </div>
                        </div>
                    </div>
                    
                    <div id="addressInfo" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                        <strong>Endereço aproximado:</strong>
                        <div id="exactAddress" style="color: #666; margin-top: 5px;">
                            Buscando endereço...
                        </div>
                    </div>
                </div>

                <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; margin: 15px 0;">
                    <div style="display: flex; align-items: flex-start;">
                        <div style="font-size: 1.2em; margin-right: 10px;">ℹ️</div>
                        <div style="font-size: 0.9em; color: #2c5530;">
                            <strong>Precisão:</strong> <span id="accuracyInfo">Calculando...</span><br>
                            Usaremos esta localização para encontrar quadras próximas a você.
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button onclick="cancelLocation()" class="btn-secondary" style="padding: 10px 20px;">
                        ❌ Cancelar
                    </button>
                    <button onclick="confirmExactLocation()" class="btn-primary" style="padding: 10px 20px;" id="confirmLocationBtn">
                        ✅ Usar Esta Localização
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// OBTER LOCALIZAÇÃO EXATA E MOSTRAR MODAL DE CONFIRMAÇÃO
function getUserLocation() {
    showLoading('📍 Obtendo sua localização precisa...');
    
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true, // Alta precisão
            timeout: 15000, // 15 segundos
            maximumAge: 0 // Não usar cache
        };
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                hideLoading();
                const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log('Localização obtida com precisão:', position.coords.accuracy + ' metros');
                
                // Mostrar modal de confirmação
                showLocationConfirmation(userLatLng, position.coords.accuracy);
            },
            function(error) {
                hideLoading();
                console.error('Erro na geolocalização:', error);
                handleGeolocationError(error);
            },
            options
        );
    } else {
        hideLoading();
        alert('Geolocalização não suportada pelo navegador.');
    }
}

// MOSTRAR MODAL DE CONFIRMAÇÃO COM DETALHES
function showLocationConfirmation(latlng, accuracy) {
    // Criar modal se não existir
    createLocationConfirmationModal();
    
    const modal = document.getElementById('locationConfirmationModal');
    const coordinatesDiv = document.getElementById('exactCoordinates');
    const addressDiv = document.getElementById('exactAddress');
    const accuracyDiv = document.getElementById('accuracyInfo');
    const confirmBtn = document.getElementById('confirmLocationBtn');
    
    // Atualizar coordenadas
    coordinatesDiv.innerHTML = `
        <strong>Latitude:</strong> ${latlng.lat.toFixed(6)}<br>
        <strong>Longitude:</strong> ${latlng.lng.toFixed(6)}
    `;
    
    // Atualizar precisão
    let accuracyText = '';
    let accuracyColor = '#28a745';
    
    if (accuracy < 10) {
        accuracyText = `Muito alta (${accuracy.toFixed(1)} metros)`;
        accuracyColor = '#28a745';
    } else if (accuracy < 50) {
        accuracyText = `Alta (${accuracy.toFixed(1)} metros)`;
        accuracyColor = '#ffc107';
    } else {
        accuracyText = `Moderada (${accuracy.toFixed(1)} metros)`;
        accuracyColor = '#fd7e14';
    }
    
    accuracyDiv.innerHTML = `<span style="color: ${accuracyColor}; font-weight: bold;">${accuracyText}</span>`;
    
    // Buscar endereço aproximado
    fetchAddressFromCoordinates(latlng.lat, latlng.lng)
        .then(address => {
            addressDiv.innerHTML = address || 'Endereço não encontrado';
        })
        .catch(error => {
            console.error('Erro ao buscar endereço:', error);
            addressDiv.innerHTML = 'Não foi possível obter o endereço';
        });
    
    // Desabilitar botão de confirmação temporariamente
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '🔄 Buscando endereço...';
    
    // Habilitar botão após 2 segundos (mesmo se o endereço falhar)
    setTimeout(() => {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '✅ Usar Esta Localização';
        
        // Salvar localização temporária para confirmação
        window.tempUserLocation = latlng;
        window.tempAccuracy = accuracy;
    }, 2000);
    
    // Mostrar modal
    modal.style.display = 'flex';
}

// BUSCAR ENDEREÇO A PARTIR DAS COORDENADAS
function fetchAddressFromCoordinates(lat, lng) {
    return new Promise((resolve, reject) => {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    // Formatar endereço de forma mais legível
                    const address = data.display_name.split(',').slice(0, 3).join(',');
                    resolve(address);
                } else {
                    resolve(null);
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

// CONFIRMAR USO DA LOCALIZAÇÃO EXATA
function confirmExactLocation() {
    const modal = document.getElementById('locationConfirmationModal');
    const latlng = window.tempUserLocation;
    const accuracy = window.tempAccuracy;
    
    if (!latlng) {
        alert('Erro: Localização não encontrada.');
        return;
    }
    
    // Fechar modal
    modal.style.display = 'none';
    

    showLoading('🎯 Configurando mapa com sua localização...');
    
   
    setTimeout(() => {
        hideLoading();
        
        // Inicializar e mostrar mapa principal
        initAndShowMap(latlng);
        
       
        addPreciseUserMarker(latlng, accuracy);
        
        findNearbyVenues(latlng);
        
      
        showLocationSuccessMessage(accuracy);
        
    }, 1000);
}


function addPreciseUserMarker(latlng, accuracy) {
    if (!map) return;
    
    
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    
    userMarker = L.marker([latlng.lat, latlng.lng])
        .addTo(map)
        .bindPopup(`
            <div style="text-align: center;">
                <div style="font-size: 2em;">📍</div>
                <strong>Sua localização exata</strong><br>
                <small>Precisão: ${accuracy.toFixed(1)}m</small>
            </div>
        `)
        .openPopup();
    
    // Adicionar círculo de precisão
    L.circle([latlng.lat, latlng.lng], {
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.1,
        radius: accuracy // Raio baseado na precisão
    }).addTo(map);
    
    // Adicionar ponto central preciso
    L.circle([latlng.lat, latlng.lng], {
        color: '#007bff',
        fillColor: '#007bff',
        fillOpacity: 0.8,
        radius: 3 // Pequeno ponto central
    }).addTo(map);
}

// MOSTRAR MENSAGEM DE SUCESSO
function showLocationSuccessMessage(accuracy) {
    // Criar mensagem temporária
    const successMessage = document.createElement('div');
    successMessage.innerHTML = `
        <div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin: 10px 0; border: 1px solid #c3e6cb;">
            <div style="display: flex; align-items: center;">
                <div style="font-size: 1.2em; margin-right: 10px;">✅</div>
                <div>
                    <strong>Localização confirmada!</strong><br>
                    <small>Precisão: ${accuracy.toFixed(1)} metros. Buscando quadras próximas...</small>
                </div>
            </div>
        </div>
    `;
    
    // Inserir antes do mapa
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.insertBefore(successMessage, mapContainer.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        successMessage.remove();
    }, 5000);
}

// CANCELAR USO DA LOCALIZAÇÃO
function cancelLocation() {
    const modal = document.getElementById('locationConfirmationModal');
    modal.style.display = 'none';
    
    // Limpar dados temporários
    window.tempUserLocation = null;
    window.tempAccuracy = null;
    
    // Mostrar mensagem
    alert('Localização cancelada. Você pode tentar novamente quando quiser.');
}

// ATUALIZAR A FUNÇÃO DE ERRO PARA SER MAIS ESPECÍFICA
function handleGeolocationError(error) {
    let errorMessage = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Para usar esta funcionalidade, por favor:\n\n1. Clique no ícone de cadeado na barra de endereço\n2. Permita o acesso à localização\n3. Recarregue a página';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Sua localização está indisponível. Verifique se:\n\n• O GPS está ativado\n• Você está em uma área com sinal\n• Tente novamente em outro local';
            break;
        case error.TIMEOUT:
            errorMessage = 'Tempo esgotado para obter localização. Verifique sua conexão e tente novamente.';
            break;
        default:
            errorMessage = 'Erro desconhecido ao obter localização: ' + error.message;
    }
    
    // Modal de erro mais amigável
    showErrorModal(errorMessage);
}

// MODAL DE ERRO
function showErrorModal(message) {
    const modalHTML = `
        <div id="locationErrorModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 450px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="color: #dc3545; margin-bottom: 15px;">❌ Erro de Localização</h3>
                
                <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    ${message.split('\n').map(line => `<div>${line}</div>`).join('')}
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeErrorModal()" class="btn-primary" style="padding: 10px 20px;">
                        Entendi
                    </button>
                    <button onclick="retryLocation()" class="btn-secondary" style="padding: 10px 20px;">
                        🔄 Tentar Novamente
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeErrorModal() {
    const modal = document.getElementById('locationErrorModal');
    if (modal) modal.remove();
}

function retryLocation() {
    closeErrorModal();
    setTimeout(() => getUserLocation(), 500);
}

function findNearbyMatches() {
    window.location.href = 'partidas-disponiveis.html';
}

// ... (mantenha o restante do código existente)