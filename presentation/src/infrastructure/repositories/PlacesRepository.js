class PlacesRepository {
	constructor(connectionUrl = "http://localhost:6692/api") {
		this.connectionUrl = connectionUrl;
	}

	async getResponse(route, method) {
		let error = null;
		let apiResponse = null;
		await fetch(`${this.connectionUrl}/${route}`, { method: method })
			.then(response => {
				if (!response.ok) {
					throw new Error(response.statusText);
				}
				return response.text();
			})
			.then(json => {
				apiResponse = json;
				console.log(apiResponse);
			})
			.catch(e => {
				error = e.message;
			});

		let response = null;
		try {
			response = JSON.parse(apiResponse);
		} catch (e) {
			response = apiResponse;
		}

		return {
			response: response,
			result: null ? !error : error,
		};
	}

	async getAllPlaces() {
		const response = await this.getResponse("places", "GET");
		return response;
	}

	async addPlace(place) {
		const response = await this.getResponse(
			`places?title=${place.Title}&description=${place.Description}&visitDate=${place.VisitDate}`,
			"POST"
		);
		return response;
	}

	async getId(title) {
		const response = await this.getResponse(`places/find/id/${title}`, "GET");
		return response;
	}
}

module.exports = PlacesRepository;
