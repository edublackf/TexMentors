import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000/api/auth';

const CICLOS = ["Ciclo 0", "Ciclo 1", "Ciclo 2", "Ciclo 3", "Ciclo 4", "Ciclo 5", "Ciclo 6", "Egresado"];
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


function RegisterForm() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: '',
        carrera: '', // Valor inicial vacío para que el placeholder del select funcione
        cicloActual: '', // Valor inicial vacío
    });
    // const [error, setError] = useState(''); // Usaremos toast
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { nombre, apellido, email, password, confirmPassword, carrera, cicloActual } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre || !apellido || !email || !password || !confirmPassword) {
            toast.error('Por favor, complete todos los campos obligatorios.');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }


        setLoading(true);
        try {
            const userDataToSubmit = { nombre, apellido, email, password, carrera, cicloActual };
            
            const response = await axios.post(`${API_URL}/register`, userDataToSubmit);
            
            setLoading(false);
            toast.success(response.data.message || '¡Registro exitoso! Por favor, inicia sesión.');
            navigate('/login'); 

        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.message || err.message || 'Error en el registro. Inténtalo de nuevo.';
            toast.error(errorMessage);
            console.error("Error en registro:", err.response || err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-card">
            <div>
                <label htmlFor="nombre">Nombre:</label>
                <input type="text" id="nombre" name="nombre" value={nombre} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="apellido">Apellido:</label>
                <input type="text" id="apellido" name="apellido" value={apellido} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" value={email} onChange={handleChange} required />
            </div>
            <div>
                <label htmlFor="password">Contraseña (mínimo 6 caracteres):</label>
                <input type="password" id="password" name="password" value={password} onChange={handleChange} required minLength="6" />
            </div>
            <div>
                <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={handleChange} required />
            </div>
            
            {/* --- CAMPO CARRERA COMO DESPLEGABLE --- */}
            <div>
                <label htmlFor="carrera">Carrera:</label>
                <select id="carrera" name="carrera" value={carrera} onChange={handleChange} > {/* Podrías añadir 'required' si es obligatorio */}
                    <option value="">-- Seleccione su Carrera --</option>
                    {CARRERAS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* --- CAMPO CICLO ACTUAL COMO DESPLEGABLE --- */}
            <div>
                <label htmlFor="cicloActual">Ciclo Actual:</label>
                <select id="cicloActual" name="cicloActual" value={cicloActual} onChange={handleChange} > {/* Podrías añadir 'required' si es obligatorio */}
                    <option value="">-- Seleccione su Ciclo --</option>
                    {CICLOS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            
            <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? 'Registrando...' : 'Registrarse como Estudiante'}
            </button>
        </form>
    );
}

export default RegisterForm;