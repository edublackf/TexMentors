import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import mentorshipSessionService from '../services/mentorshipSessionService';
// import { useAuth } from '../contexts/AuthContext'; // Para obtener proposedBy si es necesario

function CreateMentorshipSessionPage() {
    const { requestId } = useParams(); // ID de la MentorshipRequest padre
    const navigate = useNavigate();
    // const { currentUser } = useAuth(); // proposedBy se toma del token en el backend

    const [proposedDateTimes, setProposedDateTimes] = useState([{ startTime: '', endTime: '' }]);
    const [locationOrLink, setLocationOrLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleDateTimeChange = (index, field, value) => {
        const newDateTimes = [...proposedDateTimes];
        newDateTimes[index][field] = value;
        setProposedDateTimes(newDateTimes);
    };

    const addDateTimeSlot = () => {
        setProposedDateTimes([...proposedDateTimes, { startTime: '', endTime: '' }]);
    };

    const removeDateTimeSlot = (index) => {
        const newDateTimes = proposedDateTimes.filter((_, i) => i !== index);
        setProposedDateTimes(newDateTimes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (proposedDateTimes.some(dt => !dt.startTime || !dt.endTime)) {
            setError('Por favor, complete todas las fechas y horas de inicio y fin para las propuestas.');
            return;
        }
        // Validación adicional de fechas (inicio < fin, fechas válidas) podría ir aquí o confiar en el backend

        try {
            setLoading(true);
            const sessionData = {
                mentorshipRequestId: requestId,
                proposedDateTimes: proposedDateTimes.map(dt => ({ // Asegurar formato Date si es necesario
                    startTime: new Date(dt.startTime).toISOString(),
                    endTime: new Date(dt.endTime).toISOString()
                })),
                locationOrLink,
                // proposedBy se infiere del token en el backend
            };
            const response = await mentorshipSessionService.createSession(sessionData);
            setSuccessMessage(response.message || 'Nueva sesión propuesta exitosamente.');
            setTimeout(() => {
                // Redirigir a la página de detalles de la solicitud de mentoría
                // Esto podría ser diferente si es el mentor o el estudiante quien propone.
                // Por ahora, asumimos que vuelve al dashboard del estudiante o del mentor
                // dependiendo de quién esté logueado. Idealmente, a la página de detalle de la solicitud.
                navigate(-1); // Vuelve a la página anterior (detalle de la solicitud)
            }, 2000);

        } catch (err) {
            setError(err.message || 'Error al proponer la sesión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Proponer Nueva Sesión de Mentoría</h2>
            <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
                ← Volver a Detalles de Solicitud
            </button>
            <hr />

            <form onSubmit={handleSubmit}>
                <h4>Horarios Propuestos:</h4>
                {proposedDateTimes.map((dt, index) => (
                    <div key={index} style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
                        <p>Propuesta {index + 1}:</p>
                        <div>
                            <label htmlFor={`startTime-${index}`}>Inicio:</label>
                            <input 
                                type="datetime-local" 
                                id={`startTime-${index}`} 
                                value={dt.startTime} 
                                onChange={(e) => handleDateTimeChange(index, 'startTime', e.target.value)} 
                                required 
                            />
                        </div>
                        <div style={{ marginTop: '5px' }}>
                            <label htmlFor={`endTime-${index}`}>Fin:</label>
                            <input 
                                type="datetime-local" 
                                id={`endTime-${index}`} 
                                value={dt.endTime} 
                                onChange={(e) => handleDateTimeChange(index, 'endTime', e.target.value)} 
                                required 
                            />
                        </div>
                        {proposedDateTimes.length > 1 && (
                            <button type="button" onClick={() => removeDateTimeSlot(index)} style={{ marginTop: '5px', backgroundColor: 'salmon' }}>
                                Quitar Propuesta
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addDateTimeSlot} style={{ marginBottom: '10px' }}>
                    + Añadir otro horario propuesto
                </button>

                <div style={{ marginTop: '15px' }}>
                    <label htmlFor="locationOrLink">Lugar o Enlace de la Reunión (opcional):</label>
                    <input 
                        type="text" 
                        id="locationOrLink" 
                        value={locationOrLink} 
                        onChange={(e) => setLocationOrLink(e.target.value)} 
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                </div>

                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}

                <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
                    {loading ? 'Enviando Propuesta...' : 'Enviar Propuesta de Sesión'}
                </button>
            </form>
        </div>
    );
}

export default CreateMentorshipSessionPage;