const { handleTicketInteraction } = require('../systems/tickets');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        await handleTicketInteraction(interaction, client);
    },
};