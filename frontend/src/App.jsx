import React from 'react';
// Corregir la importación aquí para incluir useNavigate
import { BrowserRouter as Router, Routes, Route, Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import './App.css'; 
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminEditUserPage from './pages/AdminEditUserPage';
import AdminHelpTypesPage from './pages/AdminHelpTypesPage';
import AdminCreateHelpTypePage from './pages/AdminCreateHelpTypePage';
import AdminEditHelpTypePage from './pages/AdminEditHelpTypePage';
import AdminMentorshipRequestsPage from './pages/AdminMentorshipRequestsPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import CreateMentorshipRequestPage from './pages/CreateMentorshipRequestPage';
import StudentMentorshipRequestDetailPage from './pages/StudentMentorshipRequestDetailPage';
import MentorDashboardPage from './pages/MentorDashboardPage'; 
import MentorMentorshipRequestDetailPage from './pages/MentorMentorshipRequestDetailPage';

// Componentes placeholder para dashboards y home
const AdminDashboardLayout = () => (
    <div>
        <h2>Panel de Administrador</h2>
        <nav>
            <ul>
                <li><Link to="users">Gestionar Usuarios</Link></li>
                <li><Link to="helptypes">Gestionar Tipos de Ayuda</Link></li>
                <li><Link to="requests">Gestionar Solicitudes</Link></li>
            </ul>
        </nav>
        <hr />
        <Outlet />
    </div>
);


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
            <Route path="users/:userId/edit" element={<AdminEditUserPage />} /> 
            <Route path="helptypes" element={<AdminHelpTypesPage />} /> 
            <Route path="helptypes/new" element={<AdminCreateHelpTypePage />} /> {/* <--- NUEVA RUTA */}
            <Route path="helptypes/:helpTypeId/edit" element={<AdminEditHelpTypePage />} /> {/* <--- NUEVA RUTA */}
            <Route path="requests" element={<AdminMentorshipRequestsPage />} /> {/* <--- NUEVA RUTA */}
          </Route>

          <Route 
            path="/mentor-dashboard" 
            element={
              <ProtectedRoute rolesPermitidos={['mentor', 'admin']}>
                 <Outlet /> {/* Para permitir rutas anidadas */}     
              </ProtectedRoute>
            } 
          >
            <Route index element={<MentorDashboardPage />} />
            <Route path="requests/:requestId" element={<MentorMentorshipRequestDetailPage />} /> {/* <--- NUEVA RUTA */}
          </Route>
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute rolesPermitidos={['estudiante', 'admin']}>
                <Outlet /> 
              </ProtectedRoute>
            } 
          >
          <Route index element={<StudentDashboardPage />} /> {/* La página principal del dashboard del estudiante */}
          <Route path="create-request" element={<CreateMentorshipRequestPage />} /> 
          <Route path="requests/:requestId" element={<StudentMentorshipRequestDetailPage />} /> 
          
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;