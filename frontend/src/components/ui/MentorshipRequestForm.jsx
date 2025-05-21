import React, { useState, useEffect } from 'react';
import helpTypeService from '../../services/helpTypeService'; // Para cargar los tipos de ayuda
// import userService from '../../services/userService'; // Si quisiéramos cargar mentores

function MentorshipRequestForm({ onSubmit, initialData = null, isEditMode = false, loading = false, error = null }) {
    const [formData, setFormData] = useState({
        helpTypeId: '',
        title: '',
        description: '',
        studentAvailability: '',
        mentorUserId: '', // Opcional, si el estudiante puede sugerir un mentor
    });
    const [helpTypes, setHelpTypes] = useState([]);
    // const [mentors, setMentors] = useState([]); // Si se implementa selección de mentor
    const [formError, setFormError] = useState(''); // Errores específicos del formulario antes del submit

    // Cargar Tipos de Ayuda para el selector
    useEffect(() => {
        const loadHelpTypes = async () => {
            try {
                const data = await helpTypeService.getAllHelpTypes();
                setHelpTypes(data.filter(ht => !ht.isDeleted)); // Solo activos
            } catch (err) {
                console.error("Error cargando tipos de ayuda:", err);
                setFormError("No se pudieron cargar los tipos de ayuda. Intente más tarde.");
            }
        };
        loadHelpTypes();

        // Cargar Mentores (si se implementa)
        // const loadMentors = async () => { ... userService.getAllUsers({ rol: 'mentor' }) ... }
        // loadMentors();
    }, []);

    // Pre-llenar formulario si es modo edición y hay datos iniciales
    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                helpTypeId: initialData.helpType?._id || initialData.helpType || '', // Manejar si está populado o es solo ID
                title: initialData.title || '',
                description: initialData.description || '',
                studentAvailability: initialData.studentAvailability || '',
                mentorUserId: initialData.mentorUser?._id || initialData.mentorUser || '',
            });
        } else if (!isEditMode) {
            setFormData({ helpTypeId: '', title: '', description: '', studentAvailability: '', mentorUserId: '' });
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
        if (!formData.helpTypeId || !formData.title || !formData.description) {
            setFormError('Los campos Tipo de Ayuda, Título y Descripción son obligatorios.');
            return;
        }
        setFormError(''); // Limpiar error de formulario
        
        // Filtrar mentorUserId si está vacío para no enviarlo
        const dataToSubmit = { ...formData };
        if (!dataToSubmit.mentorUserId) {
            delete dataToSubmit.mentorUserId;
        }
        onSubmit(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="helpTypeId">Tipo de Ayuda Requerida:</label>
                <select 
                    id="helpTypeId" 
                    name="helpTypeId" 
                    value={formData.helpTypeId} 
                    onChange={handleChange} 
                    required
                >
                    <option value="">-- Seleccione un Tipo de Ayuda --</option>
                    {helpTypes.map(ht => (
                        <option key={ht._id} value={ht._id}>{ht.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="title">Título de la Solicitud:</label>
                <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    maxLength="150"
                />
            </div>

            <div>
                <label htmlFor="description">Describe tu Necesidad:</label>
                <textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    rows="5"
                />
            </div>

            <div>
                <label htmlFor="studentAvailability">Tu Disponibilidad (opcional):</label>
                <input 
                    type="text" 
                    id="studentAvailability" 
                    name="studentAvailability" 
                    value={formData.studentAvailability} 
                    onChange={handleChange}
                />
            </div>

            {/* 
            // Sección Opcional para que el estudiante sugiera un mentor
            // Necesitaría cargar la lista de mentores
            <div>
                <label htmlFor="mentorUserId">Sugerir Mentor (opcional):</label>
                <select 
                    id="mentorUserId" 
                    name="mentorUserId" 
                    value={formData.mentorUserId} 
                    onChange={handleChange}
                >
                    <option value="">-- Ninguno en particular --</option>
                    {mentors.map(mentor => (
                        <option key={mentor._id} value={mentor._id}>{mentor.nombre} {mentor.apellido}</option>
                    ))}
                </select>
            </div>
            */}
            
            {formError && <p style={{ color: 'red' }}>{formError}</p>}
            {error && <p style={{ color: 'red' }}>Error del servidor: {error}</p>} {/* Error del submit principal */}


            <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? (isEditMode ? 'Actualizando...' : 'Enviando Solicitud...') : (isEditMode ? 'Actualizar Solicitud' : 'Enviar Solicitud')}
            </button>
        </form>
    );
}

export default MentorshipRequestForm;