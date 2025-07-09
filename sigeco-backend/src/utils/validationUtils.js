/**
 * Valida un RUT chileno.
 * @param {string} rut - El RUT a validar en formato XX.XXX.XXX-X
 * @returns {boolean} - True si el RUT es válido, false en caso contrario.
 */
const validarRut = (rut) => {
    if (typeof rut !== 'string') {
        return false;
    }

    // Limpia el RUT de puntos y guion
    const rutLimpio = rut.replace(/[.-]/g, '');

    // Separa el cuerpo del dígito verificador
    let cuerpo = rutLimpio.slice(0, -1);
    let dv = rutLimpio.slice(-1).toUpperCase();

    // El cuerpo no puede estar vacío
    if (cuerpo.length < 7) {
        return false;
    }

    // Calcula el dígito verificador esperado
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
        if (multiplo < 7) {
            multiplo++;
        } else {
            multiplo = 2;
        }
    }

    const dvEsperado = 11 - (suma % 11);
    let dvCalculado;

    if (dvEsperado === 11) {
        dvCalculado = '0';
    } else if (dvEsperado === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvEsperado.toString();
    }

    // Compara el dígito verificador calculado con el proporcionado
    return dvCalculado === dv;
};

module.exports = {
    validarRut
};
