import React from "react";
import ChangeButton from "./ChangeButton";
import DeleteButton from "./DeleteButton";


const styles = {
    placeItemBlock: {
        height: '350px',
        gap: '3px',
        background: 'rgb(189,189,249)',
        background: 'linear-gradient(90deg, rgba(189,189,249,1) 0%, rgba(231,251,255,1) 99%)',
        padding: '5px',
        display: 'grid',
        gridTemplateColumns: '1tr 1tr 1tr',
        gridTemplateRows: '10% auto 15%',
        margin: '10px',
        borderRadius: '10px'
    },

    placeItemHeader: {
        borderRadius: '10px',
        background: 'white',
        gridRow: '1',
        gridColumn: '1/3',
        textAligment: 'center',
    },
    placeTitle: {
        textAlign: 'center',
        paddingTop: '2px',
        fontSize: '25px'
    },

    placeItemBody: {
        gridColumn: '1/3',
        borderRadius: '10px'
    },
    placeItemInput: {
        borderRadius: '10px',
        border: 'none',
        width: '99.5%',
        height: '100%',
        fontSize: '12.5pt'
    },

    placeItemFooter: {
        gridRow: '3',
        gridColumn: '1/3',
        display: 'flex',
        margin: '7px'
    },

    button: {
        marginRight: '10px'
    }
};

export default function PlaceItem({ place, onDelete, updDescription }) {
    return (
        <li>
            <div style={styles.placeItemBlock}>
                <div style={styles.placeItemHeader}>
                    <div style={styles.placeTitle}>
                        {place.Title}, {place.VisitDate}
                    </div>
                </div>

                <div style={styles.placeItemBody}>
                    <textarea style={styles.placeItemInput} value={place.Description}
                        onChange={e => updDescription(place.Id, e.target.value)}
                    />
                </div>
                <div style={styles.placeItemFooter}>
                    <ChangeButton props={place} />
                    <DeleteButton props={place} onDelete={onDelete} />
                </div>
            </div>
        </li>
    );
}