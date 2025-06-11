// frontend/src/pages/HomePage.jsx
import React from 'react';
import { Link, Navigate } from 'react-router-dom'; // Asegúrate de importar Navigate
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css'; // Crearemos este archivo CSS

function HomePage() {
    const { currentUser } = useAuth();

    if (currentUser) {
        if (currentUser.rol === 'admin') return <Navigate to="/admin-dashboard" replace />;
        if (currentUser.rol === 'mentor') return <Navigate to="/mentor-dashboard" replace />;
        if (currentUser.rol === 'estudiante') return <Navigate to="/student-dashboard" replace />;
        // Fallback por si el rol no es reconocido, aunque no debería pasar
        return <Navigate to="/" replace />; 
    }

    return (
        <div className="homepage-container">
            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    {/* <img src="/TexMentor-logo-white.png" alt="TexMentors" className="hero-logo" /> */}
                    <h1>Bienvenido a TexMentors</h1>
                    <p className="subtitle">
                        Conectando estudiantes para un futuro académico exitoso. <br />Recibe apoyo personalizado de compañeros de ciclos superiores y supera tus desafíos.
                    </p>
                    <Link to="/register">
                        <button className="cta-button primary-cta">Regístrate como Estudiante</button>
                    </Link>
                    <p style={{marginTop: '10px', fontSize: '0.9em'}}>
                        ¿Ya tienes cuenta? <Link to="/login" style={{color: '#f0f0f0', fontWeight:'bold'}}>Inicia Sesión</Link>
                    </p>
                </div>
            </header>

            {/* Beneficios Section */}
            <section className="benefits-section">
                <h2>¿Por Qué TexMentors?</h2>
                <div className="benefits-grid">
                    <div className="benefit-item">
                        <span className="benefit-icon">🤝</span> 
                        <h3>Apoyo Personalizado</h3>
                        <p>Recibe orientación de mentores que ya han pasado por tus mismos cursos y desafíos.</p>
                    </div>
                    <div className="benefit-item">
                        <span className="benefit-icon">📈</span>
                        <h3>Mejora tu Rendimiento</h3>
                        <p>Fortalece tus conocimientos, mejora tus notas y reduce el riesgo de deserción.</p>
                    </div>
                    
                    <div className="benefit-item">
                        <span className="benefit-icon">🎓</span>
                        <h3>Conexión Valiosa</h3>
                        <p>Crea lazos con compañeros de ciclos avanzados y amplía tu red de contactos en Tecsup.</p>
                    </div>
                </div>
            </section>

            {/* Cómo Funciona Section (Simple) */}
            <section className="how-it-works-section">
                <h2>¿Cómo Funciona?</h2>
                <ol className="steps-list" style={{ counterReset: 'step-counter' }}> {/* Asegurar que el contador se reinicie */}
                    <li><span>Regístrate</span> como estudiante en segundos.</li>
                    <li><span>Solicita</span> una mentoría en el área que necesites ayuda.</li>
                    <li><span>Conéctate</span> con un mentor asignado y programa tus sesiones.</li>
                    <li><span>Aprende</span> y alcanza tus metas académicas.</li>
                </ol>
            </section>

            {/* Testimonios Simulados Section */}
            <section className="testimonials-section">
                <h2>Lo Que Dicen Nuestros Estudiantes</h2>
                <div className="testimonials-grid">
                    <div className="testimonial-item">
                        <p>"Gracias a TexMentors, pude entender Cálculo II y aprobar el ciclo. ¡Mi mentor fue increíble!"</p>
                        <span>- Ana G., Estudiante de DDS</span>
                    </div>
                    <div className="testimonial-item">
                        <p>"Al principio me sentía perdido, pero las sesiones de mentoría me dieron la confianza que necesitaba."</p>
                        <span>- Luis M., Estudiante de Redes</span>
                    </div>
                </div>
            </section>
            
            {/* CTA Final Section */}
            <section className="final-cta-section">
                <h2>¿Listo para Empezar?</h2>
                <p>Únete a la comunidad TexMentors y da el siguiente paso en tu carrera.</p>
                <Link to="/register">
                    <button className="cta-button">Regístrate Ahora</button>
                </Link>
            </section>

            {/* Footer Simple */}
            <footer className="homepage-footer">
                <p>© {new Date().getFullYear()} TexMentors - Proyecto de Tesis. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}

export default HomePage;