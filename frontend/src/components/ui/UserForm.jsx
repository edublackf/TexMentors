import React, { useState, useEffect } from 'react';

// Roles permitidos, podrías obtenerlos de una constante o configuración
const ROLES = ['estudiante', 'mentor', 'admin'];

function UserForm({ onSubmit, initialData = null, isEditMode = false, loading = false, error = null }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        rol: 'estudiante', // Rol por defecto
        carrera: '',
        cicloActual: '',
        isVerified: false,
        // No incluimos la contraseña aquí para la edición general por admin.
        // El cambio de contraseña debería ser un proceso separado.
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                apellido: initialData.apellido || '',
                email: initialData.email || '',
                rol: initialData.rol || 'estudiante',
                carrera: initialData.carrera || '',
                cicloActual: initialData.cicloActual || '',
                isVerified: initialData.isVerified || false,
            });
        }
    }, [initialData, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Quitamos campos que no queremos enviar si están vacíos o no son para este form
        const dataToSubmit = { ...formData };
        if (dataToSubmit.carrera === '') delete dataToSubmit.carrera;
        if (dataToSubmit.cicloActual === '') delete dataToSubmit.cicloActual;
        
        onSubmit(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="nombre">Nombre:</label>
                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="apellido">Apellido:</label>
                <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="rol">Rol:</label>
                <select id="rol" name="rol" value={formData.rol} onChange={handleChange} required>
                    {ROLES.map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="carrera">Carrera (opcional):</label>
                <input type="text" id="carrera" name="carrera" value={formData.carrera} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="cicloActual">Ciclo Actual (opcional):</label>
                <input type="text" id="cicloActual" name="cicloActual" value={formData.cicloActual} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="isVerified">
                    <input type="checkbox" id="isVerified" name="isVerified" checked={formData.isVerified} onChange={handleChange} />
                    Usuario Verificado
                </label>
            </div>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Usuario' : 'Crear Usuario')}
            </button>
        </form>
    );
}

export default UserForm;