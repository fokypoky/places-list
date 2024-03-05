import React from "react";
import "./styles.css";
import PlacesRepository from '../infrastructure/PlacesRepository';

const placesRepository = new PlacesRepository();

const DeleteButton = ({ props, onDelete }) => {
	const deleteItem = () => {
		placesRepository.removePlace(props)
			.then(response => {
				if (!response.ok) {
					throw new Error(response.body);
				}

				return response.text();
			})
			.then(text => {
				onDelete(props.Id);
			})
			.catch(e => console.log(e));
	};
	return (
		<button className='act-button placeItemButton' onClick={deleteItem}>
			Удалить
		</button>
	);
};

export default DeleteButton;
