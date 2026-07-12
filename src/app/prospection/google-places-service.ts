export class GooglePlacesAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async getCityCoordinates(city: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.append("address", city);
      url.searchParams.append("components", "country:fr");
      url.searchParams.append("key", this.apiKey);
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
      
      console.error("ECHEC GEOCODING (pas grave, on utilise le fallback):", data.status, data.error_message);
      return null;
    } catch (error) {
      return null;
    }
  }

  async findLiveMusicVenues(city: string, venueType: string, maxResults: number = 200) {
    // 1. On récupère le point GPS central
    const coordinates = await this.getCityCoordinates(city);

    // 2. On mélange les murs et les organisateurs potentiels pour être exhaustif
        const queries = venueType === "Tout Type" 
      ? [
          `bar musique live "${city}"`,      // Cible les vrais bars musicaux
          `guinguette concert "${city}"`,     // Cible les guinguettes
          `salle concert "${city}"`,          // Cible les petites salles
          `festival musique "${city}"`,       // Les festivals
          `pub rock "${city}"`                // Les pubs
        ]
      : [
          `${venueType} musique live "${city}"`,
          `${venueType} concert "${city}"`
        ];
    // 3. On lance TOUTES les requêtes Google en même temps (avec le radius à 80km)
    const searchPromises = queries.map(query => this.searchGoogle(query, coordinates, city, 30));
    const results = await Promise.all(searchPromises);

    // 4. On aplatit le tableau
    let allPlaces = results.flat();

    // 5. On supprime les doublons
    const uniquePlaces = allPlaces.filter((place, index, self) => 
      index === self.findIndex((p) => p.place_id === place.place_id)
    );

    // 6. On limite à 200 lieux max pour pas exploser la facture OpenAI
    const limitedPlaces = uniquePlaces.slice(0, maxResults);

    // 7. Récupération des détails (avis)
    const placesWithDetails = await Promise.all(
      limitedPlaces.map(place => this.getPlaceDetails(place.place_id))
    );

    return placesWithDetails.filter(p => p !== null);
  }

  private async searchGoogle(query: string, coordinates: { lat: number; lng: number } | null, cityName: string, maxPerQuery: number) {
    let places: any[] = [];
    let nextPageToken: string | null = null;

    do {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
      
      // Si on a le GPS, on cible les 80km autour
      if (coordinates) {
        url.searchParams.append("query", query);
        url.searchParams.append("location", `${coordinates.lat},${coordinates.lng}`);
        url.searchParams.append("radius", "80000"); // 80 km
      } else {
        // SANS GPS : on met la ville dans le texte
        url.searchParams.append("query", `${query} ${cityName} France`);
      }

      url.searchParams.append("key", this.apiKey);
      url.searchParams.append("language", "fr");
      
      if (nextPageToken) {
        url.searchParams.append("pagetoken", nextPageToken);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === "OK" && data.results) {
        places = [...places, ...data.results];
      }

      nextPageToken = data.next_page_token || null;
      if (nextPageToken) await new Promise(resolve => setTimeout(resolve, 2000));

    } while (nextPageToken && places.length < maxPerQuery);

    return places;
  }

  private async getPlaceDetails(placeId: string) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.append("place_id", placeId);
      url.searchParams.append("fields", "name,formatted_address,formatted_phone_number,website,reviews");
      url.searchParams.append("key", this.apiKey);
      url.searchParams.append("language", "fr");

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === "OK") return data.result;
      return null;
    } catch (error) {
      return null;
    }
  }
}