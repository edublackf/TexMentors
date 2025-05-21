import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import helpTypeService from '../services/helpTypeService';
import HelpTypeForm from '../components/ui/HelpTypeForm';

function AdminCreateHelpTypePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleFormSubmit = async (formData) => {
        try {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            const response = await helpTypeService.createHelpType(formData);
            setSuccessMessage(response.message || 'Tipo de ayuda creado exitosamente.');
            setTimeout(() => {
                navigate('/admin-dashboard/helptypes'); // Volver a la lista
            }, 1500);
        } catch (err) {
            setError(err.message || 'Error al crear el tipo de ayuda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Crear Nuevo Tipo de Ayuda</h2>
            <Link to="/admin-dashboard/helptypes">Volver a la lista de Tipos de Ayuda</Link>
            <hr />
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            <HelpTypeForm 
                onSubmit={handleFormSubmit}
                isEditMode={false}
                loading={loading}
                error={error && !successMessage ? error : null}
            />
        </div>
    );
}

export default AdminCreateHelpTypePage;