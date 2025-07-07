import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; 
import userService from '../services/userService';
import { toast } from 'react-toastify';


const CARRERAS_DISPONIBLES = [
    'Diseño y Desarrollo de Software',
    'Administración de Redes y Comunicaciones',
    'Electrónica y Automatización Industrial',
    'Gestión y Mantenimiento de Maquinaria Industrial',
    'Operaciones Mineras',
    'Electricidad Industrial con mención en Sistemas Eléctricos de Potencia',
    'Producción y Gestión Industrial',
    'Gestión y Mantenimiento de Maquinaria Pesada',
    'Mecatrónica Industrial',
    'Procesos Químicos y Metalúrgicos',
    'Aviónica y Mecánica Aeronáutica',
    'Big Data y Ciencia de Datos',
    'Otra' 
];

const CICLOS_DISPONIBLES = [
    'Ciclo 0', 'Ciclo 1', 'Ciclo 2', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5', 'Ciclo 6', 'Egresado', 'Otro'
];

function ProfilePage() {
    const { currentUser, setCurrentUser } = useAuth(); 
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        carrera: '',
        cicloActual: '',
        especialidades: [],
        intereses: [],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                nombre: currentUser.nombre || '',
                apellido: currentUser.apellido || '',
                carrera: currentUser.carrera || '',
                cicloActual: currentUser.cicloActual || '',

                especialidades: currentUser.especialidades?.join(', ') || '',
                intereses: currentUser.intereses?.join(', ') || '',
            });
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
           
            const profileData = {
                ...formData,
                especialidades: formData.especialidades ? formData.especialidades.split(',').map(s => s.trim()).filter(Boolean) : [],
                intereses: formData.intereses ? formData.intereses.split(',').map(s => s.trim()).filter(Boolean) : [],
            };

            const response = await userService.updateMyProfile(profileData);
            
            
            setCurrentUser(prevUser => ({
                ...prevUser,
                ...response.user 
            }));

            toast.success(response.message || 'Perfil actualizado exitosamente.');
        } catch (error) {
            toast.error(error.message || 'Error al actualizar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return <p>Cargando perfil...</p>;
    }

    return (
        <div className="form-card" style={{ maxWidth: '600px' }}>
            <h2>Mi Perfil</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group" style={{flex: 1}}>
                        <label htmlFor="nombre">Nombre:</label>
                        <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label htmlFor="apellido">Apellido:</label>
                        <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required />
                    </div>
                </div>
                <div>
                    <label>Email (no editable):</label>
                    <input type="email" value={currentUser.email} disabled />
                </div>
                <div>
                    <label>Rol (no editable):</label>
                    <input type="text" value={currentUser.rol} disabled />
                </div>
                <div>
                    <label htmlFor="carrera">Carrera:</label>
                    <select id="carrera" name="carrera" value={formData.carrera} onChange={handleChange}>
                        <option value="">-- Selecciona tu carrera --</option>
                        {CARRERAS_DISPONIBLES.map(carrera => (
                            <option key={carrera} value={carrera}>{carrera}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="cicloActual">Ciclo Actual:</label>
                    <select id="cicloActual" name="cicloActual" value={formData.cicloActual} onChange={handleChange}>
                        <option value="">-- Selecciona tu ciclo --</option>
                        {CICLOS_DISPONIBLES.map(ciclo => (
                            <option key={ciclo} value={ciclo}>{ciclo}</option>
                        ))}
                    </select>
                </div>

                {currentUser.rol === 'mentor' && (
                    <div>
                        <label htmlFor="especialidades">Especialidades (separadas por comas):</label>
                        <input type="text" id="especialidades" name="especialidades" value={formData.especialidades} onChange={handleChange} />
                    </div>
                )}

                {currentUser.rol === 'estudiante' && (
                    <div>
                        <label htmlFor="intereses">Áreas de Interés (separadas por comas):</label>
                        <input type="text" id="intereses" name="intereses" value={formData.intereses} onChange={handleChange} />
                    </div>
                )}
                
                <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
}



export default ProfilePage;