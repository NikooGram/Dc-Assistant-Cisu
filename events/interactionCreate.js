const { handleTicketInteraction } = require('../systems/tickets');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        // Ticket system
        await handleTicketInteraction(interaction, client);

        // Sistema de sugerencias (solo botones que empiecen con "vote_")
        if (interaction.customId.startsWith('vote_')) {
            const sugerencia = client.commands.get('sugerencia');
            if (sugerencia && typeof sugerencia.handleInteraction === 'function') {
                await sugerencia.handleInteraction(interaction);
            }
        }
    },
};
