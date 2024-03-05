import React from "react";
import "./styles.css";
import PlacesRepository from '../infrastructure/PlacesRepository';
const placesRepository = new PlacesRepository();

const ChangeButton = ({ props }) => {
	const changeDescription = event => {
		event.preventDefault();

		placesRepository.updatePlace({ Id: props.Id, Title: props.Title, Description: props.Description, VisitDate: props.VisitDate })
			.then(r => {
				if (!r.ok) {
					throw new Error(r.text());
				}
				return r.text();
			})
			.then(data => {
				alert("Информация изменена");
			})
			.catch(e => {
				console.error(e);
				alert("Ошибка во время обновления");
			});
	};

	return (
		<button
			className='act-button placeItemButton'
			onClick={e => changeDescription(e)}
		>
			Изменить
		</button>
	);
};

export default ChangeButton;
