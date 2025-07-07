import React from 'react';


const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, 
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
};

const modalTitleStyle = {
    marginTop: 0,
    color: '#333',
};

const modalMessageStyle = {
    marginBottom: '25px',
    color: '#555',
};

const modalActionsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
};

// El componente del modal
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) {
        return null; 
    }

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> 
                <h3 style={modalTitleStyle}>{title || 'Confirmar Acción'}</h3>
                <p style={modalMessageStyle}>{message || '¿Estás seguro de continuar?'}</p>
                <div style={modalActionsStyle}>
                    <button onClick={onClose} style={{ backgroundColor: '#7f8c8d' }}>
                        Cancelar
                    </button>
                    <button onClick={onConfirm} style={{ backgroundColor: '#e74c3c'  }}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;