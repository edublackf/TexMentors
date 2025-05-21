import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
import MentorshipRequestForm from '../components/ui/MentorshipRequestForm'; // El nuevo formulario
// import { useAuth } from '../contexts/AuthContext'; // No es necesario aquí si el token se envía automáticamente

function CreateMentorshipRequestPage() {
    const navigate = useNavigate();
    // const { currentUser } = useAuth(); // No necesitamos el ID del estudiante aquí, el backend lo toma del token
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleFormSubmit = async (formData) => {
        try {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            
            // No necesitamos enviar studentUser, el backend lo obtiene del token.
            // mentorUserId es opcional y ya se maneja en el form.
            const response = await mentorshipRequestService.createRequest(formData);
            
            setSuccessMessage(response.message || 'Solicitud de mentoría enviada exitosamente.');
            setTimeout(() => {
                navigate('/student-dashboard'); // Volver al dashboard del estudiante
            }, 2000); // Delay para que el mensaje de éxito sea visible
        } catch (err) {
            setError(err.message || 'Error al enviar la solicitud.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Crear Nueva Solicitud de Mentoría</h2>
            <Link to="/student-dashboard">Volver a Mis Solicitudes</Link>
            <hr />
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            <MentorshipRequestForm
                onSubmit={handleFormSubmit}
                isEditMode={false} // Es modo creación
                loading={loading}
                error={error && !successMessage ? error : null} // Mostrar error del submit solo si no hay mensaje de éxito
            />
        </div>
    );
}

export default CreateMentorshipRequestPage;