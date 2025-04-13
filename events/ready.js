module.exports = {
    name: 'ready',
    once: true, // Solo se ejecuta una vez
    execute(client) {
        console.log(`✅ Bot listo como ${client.user.tag}`);
        const { sendTicketMessage } = require(`../systems/tickets`);
        sendTicketMessage(client); // Envia el mensaje estatico al canal correspondiente
    },
};