import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import helpTypeService from '../services/helpTypeService';
import HelpTypeForm from '../components/ui/HelpTypeForm';

function AdminEditHelpTypePage() {
    const { helpTypeId } = useParams(); // Obtiene el :helpTypeId de la URL
    const navigate = useNavigate();

    const [helpType, setHelpType] = useState(null);
    const [loading, setLoading] = useState(true); // Loading para carga inicial
    const [formLoading, setFormLoading] = useState(false); // Loading para el submit del form
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchHelpTypeData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const htData = await helpTypeService.getHelpTypeById(helpTypeId);
            setHelpType(htData);
        } catch (err) {
            setError(err.message || `Error al cargar datos del tipo de ayuda ${helpTypeId}.`);
            setHelpType(null);
        } finally {
            setLoading(false);
        }
    }, [helpTypeId]);

    useEffect(() => {
        fetchHelpTypeData();
    }, [fetchHelpTypeData]);

    const handleFormSubmit = async (formData) => {
        try {
            setFormLoading(true);
            setError('');
            setSuccessMessage('');
            const response = await helpTypeService.updateHelpType(helpTypeId, formData);
            setSuccessMessage(response.message || 'Tipo de ayuda actualizado exitosamente.');
            setTimeout(() => {
                navigate('/admin-dashboard/helptypes');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Error al actualizar el tipo de ayuda.');
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return <p>Cargando datos del tipo de ayuda...</p>;
    }

    if (error && !helpType) {
        return (
            <div>
                <p style={{ color: 'red' }}>Error: {error}</p>
                <Link to="/admin-dashboard/helptypes">Volver a la lista</Link>
            </div>
        );
    }
    
    if (!helpType) {
        return (
            <div>
                <p>Tipo de ayuda no encontrado.</p>
                <Link to="/admin-dashboard/helptypes">Volver a la lista</Link>
            </div>
        );
    }

    return (
        <div>
            <h2>Editar Tipo de Ayuda: {helpType.name}</h2>
            <Link to="/admin-dashboard/helptypes">Volver a la lista de Tipos de Ayuda</Link>
            <hr />
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            <HelpTypeForm 
                onSubmit={handleFormSubmit}
                initialData={helpType}
                isEditMode={true}
                loading={formLoading}
                error={error && !successMessage ? error : null}
            />
        </div>
    );
}

export default AdminEditHelpTypePage;