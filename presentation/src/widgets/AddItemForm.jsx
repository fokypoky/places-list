import React, { useState } from "react";
import './styles.css';

const styles = {
    addItemBlock: {
        height: '80px',
        margin: '11px',
        borderRadius: '10px',
        backgroundColor: 'coral',
        background: 'rgb(189,189,249)',
        background: 'linear-gradient(90deg, rgba(189,189,249,1) 0%, rgba(231,251,255,1) 99%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockItem: {
        margin: '3px',
        height: '30px'   
    },
    
    inputItem: {
        borderRadius: '10px',
        border: 'none',
        fontSize: '11.5pt'
    },

    buttonItem: {
        height: '30px'
    }
}

const AddItemForm = ({ addItem }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [visitDate, setVisitDate] = useState('');


    const onAddClick = (event) => {
        event.preventDefault();
        addItem({
            Title: title,
            Description: description,
            VisitDate: visitDate
        });
    }

    return (
        <div style={styles.addItemBlock}>
            <form style={styles.form}>
                <input value={title}
                style={{...styles.blockItem, ...styles.inputItem}}
                onChange={e => setTitle(e.target.value)}
                placeholder='Название'
                type="text"/>

                <input 
                value={description}
                style={{...styles.blockItem, ...styles.inputItem}}
                onChange={e => setDescription(e.target.value)}
                placeholder="Описание"
                type="text"/>
                
                <input
                value={visitDate}
                style={{...styles.blockItem, ...styles.inputItem}}
                onChange={e => setVisitDate(e.target.value)}
                placeholder="Дата посещения"
                type="text"/>

                <button onClick={e => onAddClick(e)} className="act-button" style={styles.buttonItem}>Добавить</button>
            </form>
        </div>
    )
}

export default AddItemForm;