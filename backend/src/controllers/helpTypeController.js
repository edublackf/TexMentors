// backend/src/controllers/helpTypeController.js
const mongoose = require('mongoose');
const HelpType = require('../models/helpTypeModel');

// @desc    Crear un nuevo tipo de ayuda (solo Admin)
// @route   POST /api/helptypes
// @access  Private/Admin
exports.createHelpType = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'El nombre del tipo de ayuda es obligatorio.' });
    }

    try {
        const helpTypeExists = await HelpType.findOne({ name });
        if (helpTypeExists && !helpTypeExists.isDeleted) { // Solo considerar si no está eliminado lógicamente
            return res.status(400).json({ message: 'Un tipo de ayuda con este nombre ya existe.' });
        }



        const helpType = await HelpType.create({
            name,
            description: description || '',
        });

        res.status(201).json({
            message: 'Tipo de ayuda creado exitosamente.',
            helpType,
        });
    } catch (error) {
        console.error('Error en createHelpType:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear el tipo de ayuda.', error: error.message });
    }
};

// @desc    Obtener todos los tipos de ayuda (activos)
// @route   GET /api/helptypes
// @access  Private (usuarios logueados) o Public (según decidas)
exports.getAllHelpTypes = async (req, res) => {
    try {
        // Por defecto, el middleware pre-find en el modelo debería filtrar los isDeleted: false
        const helpTypes = await HelpType.find({});
        res.status(200).json(helpTypes);
    } catch (error) {
        console.error('Error en getAllHelpTypes:', error);
        res.status(500).json({ message: 'Error del servidor al obtener los tipos de ayuda.', error: error.message });
    }
};

// @desc    Obtener un tipo de ayuda por ID
// @route   GET /api/helptypes/:id
// @access  Private (usuarios logueados) o Admin
exports.getHelpTypeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de tipo de ayuda no válido.' });
        }

        // El middleware pre-findOne debería filtrar por isDeleted: false
        const helpType = await HelpType.findById(req.params.id);

        if (helpType) {
            res.status(200).json(helpType);
        } else {
            res.status(404).json({ message: 'Tipo de ayuda no encontrado.' });
        }
    } catch (error) {
        console.error('Error en getHelpTypeById:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de ayuda con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener el tipo de ayuda.', error: error.message });
    }
};

// @desc    Actualizar un tipo de ayuda por ID (solo Admin)
// @route   PUT /api/helptypes/:id
// @access  Private/Admin
exports.updateHelpType = async (req, res) => {
    const { name, description } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de tipo de ayuda no válido.' });
        }

        const helpType = await HelpType.findById(req.params.id);

        if (!helpType || helpType.isDeleted) { // No encontrar si está eliminado lógicamente tampoco
            return res.status(404).json({ message: 'Tipo de ayuda no encontrado o ya eliminado.' });
        }

        // Verificar si el nuevo nombre ya existe para OTRO tipo de ayuda (que no esté eliminado)
        if (name && name !== helpType.name) {
            const existingHelpType = await HelpType.findOne({ name: name, isDeleted: false });
            if (existingHelpType && existingHelpType._id.toString() !== helpType._id.toString()) {
                return res.status(400).json({ message: 'Otro tipo de ayuda con este nombre ya existe.' });
            }
            helpType.name = name;
        }

        if (description !== undefined) helpType.description = description;

        const updatedHelpType = await helpType.save();

        res.status(200).json({
            message: 'Tipo de ayuda actualizado exitosamente.',
            helpType: updatedHelpType,
        });

    } catch (error) {
        console.error('Error en updateHelpType:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de ayuda con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el tipo de ayuda.', error: error.message });
    }
};

// @desc    Eliminar (lógicamente) un tipo de ayuda por ID (solo Admin)
// @route   DELETE /api/helptypes/:id
// @access  Private/Admin
exports.deleteHelpType = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de tipo de ayuda no válido.' });
        }

        const helpType = await HelpType.findById(req.params.id);

        if (!helpType || helpType.isDeleted) {
            return res.status(404).json({ message: 'Tipo de ayuda no encontrado o ya eliminado.' });
        }

        helpType.isDeleted = true;
        helpType.deletedAt = new Date();
        await helpType.save();

        res.status(200).json({ message: 'Tipo de ayuda eliminado exitosamente.' });

    } catch (error) {
        console.error('Error en deleteHelpType:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de tipo de ayuda con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar el tipo de ayuda.', error: error.message });
    }
};