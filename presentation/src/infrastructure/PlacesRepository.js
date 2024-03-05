class PlacesRepository {
	constructor(apiUrl = 'http://localhost:6692/api') {
		this.baseUrl = apiUrl;
	}

	getAllPlaces() {
		return fetch(`${this.baseUrl}/places`);
	}

	addPlace(place) {
		return fetch(`${this.baseUrl}/places?title=${place.Title}&description=${place.Description}&visitdate=${place.VisitDate}`, { method: 'POST' });
	}

	updatePlace(place) {
		return fetch(`${this.baseUrl}/places/${place.Id}?title=${place.Title}&description=${place.Description}&visitdate=${place.VisitDate}`, { method: 'PUT' });
	}

	removePlace(place) {
		return fetch(`${this.baseUrl}/places/${place.Id}`, { method: 'DELETE' });
	}
}

export default PlacesRepository;