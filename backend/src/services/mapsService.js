const axios = require('axios');

class MapsService {
  // Buscar locais esportivos reais no OpenStreetMap
  async findSportsVenuesNearby(lat, lng, radius = 5000) {
    try {
      console.log(`Buscando locais esportivos em: ${lat}, ${lng}, raio: ${radius}m`);
      
      const overpassQuery = `
        [out:json][timeout:30];
        (
          // Quadras esportivas
          node["leisure"="pitch"](around:${radius},${lat},${lng});
          way["leisure"="pitch"](around:${radius},${lat},${lng});
          
          // Centros esportivos
          node["leisure"="sports_centre"](around:${radius},${lat},${lng});
          way["leisure"="sports_centre"](around:${radius},${lat},${lng});
          
          // Ginásios
          node["amenity"="sports_centre"](around:${radius},${lat},${lng});
          way["amenity"="sports_centre"](around:${radius},${lat},${lng});
          
          // Campos de futebol
          node["sport"="soccer"](around:${radius},${lat},${lng});
          way["sport"="soccer"](around:${radius},${lat},${lng});
        );
        out center;
      `;

      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(overpassQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      console.log(`Encontrados ${response.data.elements.length} locais no OpenStreetMap`);

      const venues = response.data.elements.map(element => {
        const isWay = element.type === 'way';
        const coordinates = isWay ? element.center : element;
        
        return {
          id: element.id,
          type: element.type,
          name: element.tags?.name || this.generateVenueName(element.tags),
          sport: this.getSportType(element.tags),
          address: this.getAddress(element.tags),
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          tags: element.tags,
          source: 'openstreetmap'
        };
      });

      return venues;

    } catch (error) {
      console.error('Erro ao buscar locais no OpenStreetMap:', error);
      
      // Retornar array vazio em vez de dados fictícios
      return [];
    }
  }

  // Gerar nome baseado nas tags do OSM
  generateVenueName(tags) {
    if (tags?.sport) {
      return `Quadra de ${tags.sport}`;
    }
    if (tags?.leisure === 'pitch') {
      return 'Quadra Esportiva';
    }
    if (tags?.leisure === 'sports_centre') {
      return 'Centro Esportivo';
    }
    return 'Local Esportivo';
  }

  // Determinar tipo de esporte baseado nas tags
  getSportType(tags) {
    const sport = tags?.sport;
    if (sport) return sport;
    
    if (tags?.leisure === 'pitch') return 'variados';
    if (tags?.leisure === 'sports_centre') return 'multiuso';
    
    return 'esportes';
  }

  // Extrair endereço das tags
  getAddress(tags) {
    if (tags?.['addr:street']) {
      return `${tags['addr:street']}${tags['addr:housenumber'] ? ', ' + tags['addr:housenumber'] : ''}`;
    }
    return tags?.address || 'Endereço não disponível';
  }

  // ... (mantemos os métodos de geocoding que são úteis)
  async geocodeAddress(address) {
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: address,
            format: 'json',
            limit: 1,
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'PlayMatchApp/1.0'
          }
        }
      );

      if (response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          placeId: result.place_id
        };
      }
      return null;
    } catch (error) {
      console.error('Erro no geocoding Nominatim:', error);
      return null;
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: lat,
            lon: lng,
            format: 'json'
          },
          headers: {
            'User-Agent': 'PlayMatchApp/1.0'
          }
        }
      );

      if (response.data) {
        return {
          address: response.data.display_name,
          placeId: response.data.place_id
        };
      }
      return null;
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
      return null;
    }
  }
}

module.exports = new MapsService();