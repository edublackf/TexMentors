import React, { useState, useEffect } from 'react';

function HelpTypeForm({ onSubmit, initialData = null, isEditMode = false, loading = false, error = null }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
            });
        } else if (!isEditMode) { // Asegurar que el formulario esté vacío para crear
            setFormData({ name: '', description: ''});
        }
    }, [initialData, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">Nombre del Tipo de Ayuda:</label>
                <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                />
            </div>
            <div>
                <label htmlFor="description">Descripción (opcional):</label>
                <textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange}
                    rows="3"
                />
            </div>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
                {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Tipo de Ayuda' : 'Crear Tipo de Ayuda')}
            </button>
        </form>
    );
}

export default HelpTypeForm;