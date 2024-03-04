import React, { useEffect, useState } from "react";
import PlacesList from "./PlacesList";
import AddItemForm from "./windgets/AddItemForm";
const PlacesRepository = require('./infrastructure/repositories/PlacesRepository');
const placesRepository = new PlacesRepository();

function App() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      const result = await placesRepository.getAllPlaces();
      setPlaces(result.response);
    };
    fetchPlaces();
  }, []);

  const addNewPlace = (place) => {
    const postUrl = `http://api:80/api/places?title=${place.Title}&description=${place.Description}&visitdate=${place.VisitDate}`;

    fetch(postUrl, { method: 'POST' })
      .then(r => {
        if (!r.ok) {
          throw new Error(r.text());
        }
        return r.text();
      }).then(data => {
        place.Id = data;
        setPlaces([...places, place]);
      }).catch(e => console.log(e));
  };

  const deleteItem = (id) => {
    setPlaces(places.filter(place => place.Id !== id));
  };

  const updateDescription = (id, description) => {
    setPlaces(places.map(place => {
      if (place.Id === id) {
        return {
          Id: place.Id,
          Title: place.Title,
          Description: description,
          VisitDate: place.VisitDate
        };
      }
      return place;
    }));
  };
  return (
    <div className="wrapper">
      <h1>Список посещенных мест</h1>
      <AddItemForm addItem={addNewPlace} />
      <PlacesList places={places} onDelete={deleteItem} updDescription={updateDescription} />
    </div>
  );
}

export default App;