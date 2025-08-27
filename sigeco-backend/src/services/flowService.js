// sigeco-backend/src/services/flowService.js
const crypto = require('crypto');
const fetch = require('node-fetch');

const API_URL = 'https://sandbox.flow.cl/api';
const secretKey = process.env.FLOW_SECRET_KEY;

const signParams = (params) => {
    const sortedKeys = Object.keys(params).sort();
    let toSign = '';
    sortedKeys.forEach(key => {
        toSign += key + params[key];
    });
    return crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
};

exports.crearOrdenDePago = async (paymentData) => {
    const params = {
        apiKey: process.env.FLOW_API_KEY,
        commerceOrder: paymentData.orden_compra,
        subject: paymentData.subject,
        currency: 'CLP',
        amount: paymentData.monto,
        email: paymentData.email,
        urlConfirmation: `https://sigeco.mindshot.cl/api/public/flow/confirmacion`,
        urlReturn: `https://sigeco.mindshot.cl/pago/retorno`
    };

    params.s = signParams(params);

    try {
        const response = await fetch(`${API_URL}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params),
        });
        const result = await response.json();
        if (response.status !== 200) throw new Error(result.message || 'Error al crear la orden en Flow.');
        return { redirectUrl: `${result.url}?token=${result.token}`, token: result.token };
    } catch (error) {
        console.error("Error en flowService.crearOrdenDePago:", error);
        throw error;
    }
};

// --- NUEVA FUNCIÓN PARA VERIFICAR EL ESTADO ---
exports.obtenerEstadoDelPago = async (token) => {
    const params = {
        apiKey: process.env.FLOW_API_KEY,
        token: token,
    };
    params.s = signParams(params);

    try {
        const url = new URL(`${API_URL}/payment/getStatus`);
        url.search = new URLSearchParams(params).toString();

        const response = await fetch(url);
        const result = await response.json();

        if (response.status !== 200) {
            throw new Error(result.message || 'Error al obtener el estado del pago en Flow.');
        }
        return result; // Devuelve el objeto completo de Flow (ej: { status: 2, ... })
    } catch (error) {
        console.error("Error en flowService.obtenerEstadoDelPago:", error);
        throw error;
    }
};