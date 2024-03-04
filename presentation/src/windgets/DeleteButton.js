import React from "react";
import "./styles.css";

const DeleteButton = ({ props, onDelete }) => {
	const deleteItem = () => {
		fetch(`http://localhost:6692/api/places/${props.Id}`, { method: "DELETE" })
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
