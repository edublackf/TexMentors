import React from 'react';
// Corregir la importación aquí para incluir useNavigate
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import './App.css'; 
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminUsersPage from './pages/AdminUsersPage';

// Componentes placeholder para dashboards y home
const AdminDashboardLayout = () => (
    <div>
        <h2>Panel de Administrador</h2>
        <nav>
            <ul>
                <li><Link to="users">Gestionar Usuarios</Link></li> {/* Ruta relativa al layout */}
                <li><Link to="helptypes">Gestionar Tipos de Ayuda (Pronto)</Link></li> {/* Ruta relativa */}
            </ul>
        </nav>
        <hr />
        <Outlet />
    </div>
);
const MentorDashboardPage = () => <h2>Panel de Mentor</h2>;
const StudentDashboardPage = () => <h2>Panel de Estudiante</h2>;
const HomePage = () => <h2>Página de Inicio Pública</h2>;

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate(); // Ahora debería estar definido

    const handleLogout = () => {
        logout();
        navigate('/login'); 
    };

    return (
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {!currentUser ? (
                <li><Link to="/login">Login</Link></li>
            ) : (
                <>
                    {currentUser.rol === 'admin' && <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>}
                    {currentUser.rol === 'mentor' && <li><Link to="/mentor-dashboard">Mentor Dashboard</Link></li>}
                    {currentUser.rol === 'estudiante' && <li><Link to="/student-dashboard">Estudiante Dashboard</Link></li>}
                    <li>
                        <span>Hola, {currentUser.nombre}! ({currentUser.rol}) </span>
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                </>
            )}
          </ul>
        </nav>
    );
};

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <hr />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />

          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<div>Bienvenido al Panel de Administrador. Selecciona una opción del menú.</div>} />
            <Route path="users" element={<AdminUsersPage />} /> 
            <Route path="helptypes" element={<div>Página de Gestión de Tipos de Ayuda (Pronto)</div>} />
          </Route>

          <Route 
            path="/mentor-dashboard" 
            element={
              <ProtectedRoute rolesPermitidos={['mentor', 'admin']}>
                <MentorDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute rolesPermitidos={['estudiante', 'admin']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;