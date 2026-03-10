const { validationResult } = require('express-validator');
const BaseDatosModel = require('../models/baseDatosModel');
const Formulario = require('../models/formularioModel'); 
const ExcelJS = require('exceljs');

exports.getAllBasesDatos = async (req, res) => {
    try {
        const bases = await BaseDatosModel.findAllWithCount();
        res.json({ success: true, data: bases });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al obtener las bases de datos.' });
    }
};

exports.importarContactos = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre_base, contactos } = req.body;
    try {
        const result = await BaseDatosModel.importar(nombre_base, contactos);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor durante la importación.' });
    }
};

exports.fusionarBases = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, origen, bases_origen } = req.body;
    try {
        const result = await BaseDatosModel.fusionar(nombre, origen, bases_origen);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor durante la fusión.' });
    }
};

exports.assignContactsToBase = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { contactIds, baseIds } = req.body;

    try {
        const result = await BaseDatosModel.assignContacts(contactIds, baseIds);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteBaseDatos = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    try {
        const result = await BaseDatosModel.deleteById(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Base de datos no encontrada.' });
        }
        res.json({ success: true, message: 'Base de datos eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar la base de datos.' });
    }
};

exports.generarPlantillaImportacion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { id_campana } = req.params;
        
        const camposFormulario = await Formulario.getCamposByCampanaId(id_campana);

        if (camposFormulario.length === 0) {
            return res.status(404).json({ message: 'No se encontró configuración de formulario para este evento.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plantilla de Importación');

        const columns = camposFormulario.map(campo => {
            const width = ['nombre', 'email', 'empresa', 'profesion'].includes(campo.nombre_interno) ? 30 : 20;
            return {
                header: campo.etiqueta, 
                key: campo.nombre_interno, 
                width: width
            };
        });

        // Verificamos si la campaña requiere pago
        const pool = require('../config/db');
        const [campanaRules] = await pool.query(`
            SELECT s.obligatorio_pago 
            FROM campanas c 
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento 
            WHERE c.id_campana = ?
        `, [id_campana]);

        const tienePago = campanaRules.length > 0 && campanaRules[0].obligatorio_pago === 1;

        // --- LÓGICA DE COLUMNAS DE TESORERÍA ---
        // Se añaden como opcionales si el evento tiene cobro
        if (tienePago) {
            columns.push({
                header: 'Monto Pagado (Opcional)',
                key: 'monto_pagado',
                width: 25
            });
            columns.push({
                header: 'Medio de Pago (Opcional)',
                key: 'medio_pago',
                width: 25
            });
        }

        worksheet.columns = columns;
        worksheet.getRow(1).font = { bold: true };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="plantilla_importacion_evento.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar la plantilla de importación:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};