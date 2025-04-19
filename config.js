require('dotenv').config();

module.exports = {
    token: process.env.TOKEN, // Token del bot
    prefix: process.env.PREFIX || '!', // Prefijo para los comandos
    channels: {
        support: process.env.SUPPORT_CHANNEL_ID, // Canal de soporte para tickets
        welcome: process.env.WELCOME_CHANNEL_ID || 'bienvenidas', // Canal de bienvenidas
        transcriptLog: process.env.TRANSCRIPT_LOG_CHANNEL_ID || 'registro', // Canal para transcripciones
        sorteoLog: process.env.SORTEO_LOG_CHANNEL_ID, // Canal para registrar sorteos
        sugerenciaLog: process.env.SUGERENCIA_LOG_CHANNEL_ID, // canal para registrar sugerencias
    },
    roles: {
        staff: process.env.STAFF_ROLE_ID, // Rol de Staff
        asistente: process.env.ASISTENTE_ROLE_ID, // Rol de Asistente
    },
    categories: {
        ticket: process.env.TICKET_CATEGORY_ID, // Categoría para tickets
    },
};