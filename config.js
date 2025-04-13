require('dotenv').config();

module.exports = {
    token: process.env.TOKEN, // Token del bot
    prefix: process.env.PREFIX || '!', // Prefijo para los comandos
    channels: {
        support: process.env.SUPPORT_CHANNEL_ID, // Canal de soporte para tickets
        welcome: process.env.WELCOME_CHANNEL_ID, // Canal de bienvenidas
        transcriptLog: process.env.TRANSCRIPT_LOG_CHANNEL_ID || 'registro', // Canal para transcripciones
        sorteoLog: process.env.SORTEO_LOG_CHANNEL_ID,
    },
    roles: {
        staff: process.env.STAFF_ROLE_ID, // Rol de Staff
    },
    categories: {
        ticket: process.env.TICKET_CATEGORY_ID, // Categoría para tickets
    },
};