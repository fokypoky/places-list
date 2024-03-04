import React from "react";
import PlaceItem from "./windgets/PlaceItem";

const styles = {
    ul: {
        listStyle: 'none',
        margin: 0,
        padding: 0
    },
};

export default function PlacesList(props) {
    return (
        <ul style={styles.ul}>
            {props.places.map((place, index) => {
                return <PlaceItem place={place} key={place.Id} onDelete={props.onDelete} updDescription={props.updDescription} />;
            })}
        </ul>
    );
}