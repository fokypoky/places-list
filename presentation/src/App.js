import React, { useEffect, useState } from "react";
import PlacesList from "./widgets/PlacesList";
import AddItemForm from "./widgets/AddItemForm";
import PlacesRepository from './infrastructure/PlacesRepository';

const placesRepository = new PlacesRepository();

function App() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    placesRepository.getAllPlaces()
      .then(r => {
        if (!r.ok) {
          throw new Error(r.statusText);
        }
        return r.text();
      }).then(t => setPlaces(JSON.parse(t)))
      .catch(e => console.error(e));
  }, []);

  const addNewPlace = place => {
    placesRepository.addPlace(place)
      .then(r => {
        if (!r.ok) {
          throw new Error(r.text());
        }
        return r.text();
      })
      .then(data => {
        place.Id = data;
        setPlaces([...places, place]);
      })
      .catch(e => console.log(e));
  };

  const deleteItem = id => {
    setPlaces(places.filter(place => place.Id !== id));
  };

  const updateDescription = (id, description) => {
    setPlaces(
      places.map(place => {
        if (place.Id === id) {
          return {
            Id: place.Id,
            Title: place.Title,
            Description: description,
            VisitDate: place.VisitDate,
          };
        }
        return place;
      })
    );
  };
  return (
    <div className='wrapper'>
      <h1>Список посещенных мест</h1>
      <AddItemForm addItem={addNewPlace} />
      <PlacesList
        places={places}
        onDelete={deleteItem}
        updDescription={updateDescription}
      />
    </div>
  );
}

export default App;
