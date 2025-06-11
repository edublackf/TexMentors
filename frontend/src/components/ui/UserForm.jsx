import React, { useState, useEffect } from 'react';

// Roles permitidos (como lo teníamos)
const ROLES = ['estudiante', 'mentor', 'admin'];

// NUEVAS LISTAS PARA DESPLEGABLES
const CICLOS = [
    "Ciclo 0", "Ciclo 1", "Ciclo 2", "Ciclo 3", 
    "Ciclo 4", "Ciclo 5", "Ciclo 6", "Egresado"
];

const CARRERAS = [
    "Diseño y Desarrollo de Software",
    "Administración de Redes y Comunicaciones",
    "Electrónica y Automatización Industrial",
    "Gestión y Mantenimiento de Maquinaria Industrial",
    "Operaciones Mineras",
    "Electricidad Industrial con mención en Sistemas Eléctricos de Potencia",
    "Producción y Gestión Industrial",
    "Gestión y Mantenimiento de Maquinaria Pesada",
    "Mecatrónica Industrial",
    "Procesos Químicos y Metalúrgicos",
    "Aviónica y Mecánica Aeronáutica",
    "Big Data y Ciencia de Datos"
];


function UserForm({ onSubmit, initialData = null, isEditMode = false, loading = false, error = null }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        rol: 'estudiante',
        carrera: '', // <--- Valor inicial vacío o el primer elemento de la lista
        cicloActual: '', // <--- Valor inicial vacío o el primer elemento de la lista
        isVerified: false,
    });

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                apellido: initialData.apellido || '',
                email: initialData.email || '',
                rol: initialData.rol || 'estudiante',
                carrera: initialData.carrera || '', // Si viene de la DB, se preselecciona
                cicloActual: initialData.cicloActual || '', // Si viene de la DB, se preselecciona
                isVerified: initialData.isVerified || false,
            });
        } else if (!isEditMode) { // Para el modo creación, asegurar valores por defecto o vacíos
             setFormData({
                nombre: '',
                apellido: '',
                email: '',
                rol: 'estudiante',
                carrera: '', // Empezar con "seleccione"
                cicloActual: '', // Empezar con "seleccione"
                isVerified: false,
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
        const dataToSubmit = { ...formData };
        // Si "seleccione" es una opción con valor vacío, y es opcional, el backend debe manejarlo
        // o podemos quitarlo antes de enviar si no se seleccionó una carrera/ciclo real
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

            {/* CAMPO CARRERA COMO DESPLEGABLE */}
            <div>
                <label htmlFor="carrera">Carrera:</label>
                <select id="carrera" name="carrera" value={formData.carrera} onChange={handleChange}>
                    <option value="">-- Seleccione una Carrera --</option>
                    {CARRERAS.map(carrera => (
                        <option key={carrera} value={carrera}>{carrera}</option>
                    ))}
                </select>
            </div>

            {/* CAMPO CICLO ACTUAL COMO DESPLEGABLE */}
            <div>
                <label htmlFor="cicloActual">Ciclo Actual:</label>
                <select id="cicloActual" name="cicloActual" value={formData.cicloActual} onChange={handleChange}>
                     <option value="">-- Seleccione un Ciclo --</option>
                    {CICLOS.map(ciclo => (
                        <option key={ciclo} value={ciclo}>{ciclo}</option>
                    ))}
                </select>
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