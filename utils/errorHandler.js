const fs = require('fs');
const path = require('path');

/**
 * Registra errores en un archivo de log.
 * @param {Error|string} error - Error o mensaje de error.
 */
function logErrorToFile(error) {
    const logFilePath = path.join(__dirname, '../logs', 'error.log');
    const logMessage = `[${new Date().toISOString()}] ${error.stack || error}\n`;

    // Crear el directorio de logs si no existe
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

    // Escribir el error en el archivo de log
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

/**
 * Configura los manejadores para errores globales.
 */
function handleUncaughtErrors() {
    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
        console.error('❌ Error no capturado:', error);
        logErrorToFile(error);
    });

    // Manejar promesas rechazadas no manejadas
    process.on('unhandledRejection', (reason) => {
        console.error('❌ Promesa rechazada no manejada:', reason);
        logErrorToFile(reason);
    });
}

module.exports = {
    handleUncaughtErrors,
};