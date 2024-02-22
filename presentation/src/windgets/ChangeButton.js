import React from "react";
import './styles.css';

const ChangeButton = ({props}) => {
    const changeDescription = (event) => {
        event.preventDefault();
        
        const updateUrl = `http://localhost:6800/api/places/${props.Id}?title=${props.Title}&description=${props.Description}&visitdate=${props.VisitDate}`;

        fetch(updateUrl, {method: 'PUT'})
            .then(r => {
                if(!r.ok){
                    throw new Error(r.text());
                }
                return r.text();
            }).then(data => {
                alert('Информация изменена');
            }).catch(e => {
                console.error(e);
                alert('Ошибка во время обновления');
            })
    }

    return (
        <button className="act-button placeItemButton" onClick={(e => changeDescription(e))}>Изменить</button>
    )
}

export default ChangeButton;