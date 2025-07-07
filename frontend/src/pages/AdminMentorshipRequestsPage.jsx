import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import mentorshipRequestService from "../services/mentorshipRequestService";
import userService from "../services/userService"; // Para cargar lista de mentores para asignar

function AdminMentorshipRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [mentors, setMentors] = useState([]); // Lista de mentores para el selector de asignación
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // Estado para el modal/formulario de edición/asignación
  const [editingRequest, setEditingRequest] = useState(null); // Contendrá la solicitud que se está editando
  const [selectedMentor, setSelectedMentor] = useState(""); // Para el select de asignación de mentor
  const [newStatus, setNewStatus] = useState(""); // Para el select de cambio de estado
  const [internalNotes, setInternalNotes] = useState(""); // Para las notas internas

  const ALL_STATUSES = [
    // Definir todos los estados posibles para el selector del admin
    "pendiente",
    "aceptada_mentor",
    "rechazada_mentor",
    "rechazada_admin",
    "en_progreso",
    "completada",
    "cancelada_estudiante",
    "cancelada_admin",
    "cancelada_mentor",
  ];

  const ADMIN_STATUS_ACTIONS = {
    "": "Mantener Estado Actual", // Opción por defecto
    pendiente: "Marcar como Pendiente",
    rechazada_admin: "Rechazar Solicitud",
    en_progreso: 'Forzar a "En Progreso"',
    completada: 'Forzar a "Finalizada"',
    cancelada_admin: "Cancelar Solicitud (Admin)",
  };

  const fetchRequestsAndMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setActionMessage("");
      setActionError("");

      const requestsData = await mentorshipRequestService.getAllRequests(); // Admin ve todas
      setRequests(requestsData);

      console.log("Fetching all users for mentor list...");
      const usersData = await userService.getAllUsers();
      console.log("All users received:", usersData);
      setMentors(
        usersData.filter((user) => user.rol === "mentor" && !user.isDeleted)
      );

      const activeMentors = usersData.filter(
        (user) => user.rol === "mentor" && !user.isDeleted
      );
      // Filtrar solo mentores activos
      console.log("Filtered active mentors:", activeMentors);

      setMentors(activeMentors);
    } catch (err) {
      setError(err.message || "Error al cargar datos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequestsAndMentors();
  }, [fetchRequestsAndMentors]);

  const openEditModal = (request) => {
    setEditingRequest(request);
    setSelectedMentor(request.mentorUser?._id || ""); // Pre-seleccionar mentor si ya está asignado
    setNewStatus(request.status || ""); // Pre-seleccionar estado actual
    setInternalNotes(request.internalNotes || "");
    setActionMessage("");
    setActionError("");
  };

  const closeEditModal = () => {
    setEditingRequest(null);
    setSelectedMentor("");
    setNewStatus("");
    setInternalNotes("");
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;

    const updateData = {};
    if (newStatus && newStatus !== editingRequest.status) {
      updateData.status = newStatus;
    }
    // Comprobar si el mentor seleccionado es diferente al actual o si se quiere desasignar
    const currentMentorId = editingRequest.mentorUser?._id || null;
    const newMentorId = selectedMentor === "" ? null : selectedMentor; // "" o null para desasignar

    console.log(
      "Current Mentor ID (from request):",
      currentMentorId,
      typeof currentMentorId
    );
    console.log(
      "New Selected Mentor ID (from dropdown):",
      newMentorId,
      typeof newMentorId
    );

    if (newMentorId !== currentMentorId) {
      updateData.mentorUser = newMentorId;
      console.log("MENTOR CHANGED - Adding to updates:", newMentorId);
    } else {
      console.log("MENTOR NOT CHANGED - Not adding to updates.");
    }

    if (internalNotes !== editingRequest.internalNotes) {
      updateData.internalNotes = internalNotes;
    }

    console.log("Update Data Object:", updateData); // <-- MUY IMPORTANTE

    if (Object.keys(updateData).length === 0) {
      setActionError("No se han realizado cambios para actualizar.");
      setTimeout(() => setActionError(""), 3000);
      return;
    }

    try {
      setLoading(true); // O un formLoading específico
      const response = await mentorshipRequestService.updateRequest(
        editingRequest._id,
        updateData
      );
      setActionMessage(
        response.message || "Solicitud actualizada exitosamente."
      );
      closeEditModal();
      await fetchRequestsAndMentors(); // Recargar todo
    } catch (err) {
      setActionError(err.message || "Error al actualizar la solicitud.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId, requestTitle) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar la solicitud "${requestTitle}"?`
      )
    ) {
      try {
        setLoading(true);
        const response = await mentorshipRequestService.deleteRequest(
          requestId
        );
        setActionMessage(
          response.message || "Solicitud eliminada exitosamente."
        );
        await fetchRequestsAndMentors();
      } catch (err) {
        setActionError(err.message || "Error al eliminar la solicitud.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && requests.length === 0 && mentors.length === 0) {
    return <p>Cargando datos...</p>;
  }
  if (error && requests.length === 0) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Gestión de Solicitudes de Mentoría (Admin)</h2>

      {actionMessage && <p style={{ color: "green" }}>{actionMessage}</p>}
      {actionError && (
        <p style={{ color: "red" }}>Error en acción: {actionError}</p>
      )}
      {loading && <p>Actualizando...</p>}

      {editingRequest && (
        <div
          style={{
            border: "2px solid blue",
            padding: "20px",
            margin: "20px 0",
          }}
        >
          <h3>Editando Solicitud: {editingRequest.title}</h3>
          <p>
            <strong>Estudiante:</strong> {editingRequest.studentUser?.nombre}{" "}
            {editingRequest.studentUser?.apellido}
          </p>
          <form onSubmit={handleUpdateRequest}>
            <div>
              <label htmlFor="mentorAssign">Asignar Mentor:</label>
              {mentors.length === 0 ? (
                <p style={{ color: "red" }}>
                  No hay mentores activos disponibles para asignar.
                </p>
              ) : (
                <div
                  style={{
                    fontSize: "0.9em",
                    color: "#555",
                    marginBottom: "5px",
                  }}
                >
                  <strong>Mentores disponibles:</strong>{" "}
                  {mentors.map((m) => `${m.nombre} ${m.apellido}`).join(", ")}
                </div>
              )}
              <select
                id="mentorAssign"
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
              >
                <option value="">-- Sin Asignar --</option>
                {mentors.map((mentor) => (
                  <option key={mentor._id} value={mentor._id}>
                    {mentor.nombre} {mentor.apellido} (
                    {mentor.especialidades?.join(", ") || "General"})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: "10px" }}>
              <label htmlFor="statusUpdate">Cambiar Estado:</label>
              <select
                id="statusUpdate"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.entries(ADMIN_STATUS_ACTIONS).map(
                  ([statusValue, statusText]) => (
                    <option key={statusValue} value={statusValue}>
                      {statusText}
                    </option>
                  )
                )}
              </select>
            </div>
            <div style={{ marginTop: "10px" }}>
              <label htmlFor="internalNotes">Notas Internas:</label>
              <textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows="3"
                style={{ width: "90%" }}
              />
            </div>
            <button
              type="submit"
              style={{ marginTop: "10px" }}
              disabled={loading}
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={closeEditModal}
              style={{ marginLeft: "10px" }}
              disabled={loading}
            >
              Cancelar Edición
            </button>
          </form>
        </div>
      )}

      {requests.length === 0 && !loading ? (
        <p>No hay solicitudes de mentoría para mostrar.</p>
      ) : (
        <table
          border="1"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th>Título</th>
              <th>Estudiante</th>
              <th>Mentor Asignado</th>
              <th>Tipo Ayuda</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr
                key={req._id}
                style={{ backgroundColor: req.isDeleted ? "#ffe0e0" : "" }}
              >
                <td>{req.title}</td>
                <td>
                  {req.studentUser?.nombre} {req.studentUser?.apellido}
                </td>
                <td>
                  {req.mentorUser?.nombre || "-"}{" "}
                  {req.mentorUser?.apellido || ""}
                </td>
                <td>{req.helpType?.name}</td>
                <td>{req.status}</td>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => openEditModal(req)}
                    disabled={req.isDeleted}
                  >
                    Editar/Asignar
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(req._id, req.title)}
                    disabled={req.isDeleted}
                    style={{
                      marginLeft: "5px",
                      backgroundColor: req.isDeleted ? "grey" : "tomato",
                      color: "white",
                    }}
                  >
                    {req.isDeleted ? "Eliminada" : "Eliminar"}
                  </button>
                  {/* Podríamos añadir un Link a una página de detalle si es necesario */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminMentorshipRequestsPage;
