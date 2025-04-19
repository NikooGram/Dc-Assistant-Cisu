const getRandomColor = require('../utils/getRandomColor');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'help', // Nombre del comando
    description: 'Comando de ayuda sobre el server.',
    async execute(message) {

        const helpEmbed = new EmbedBuilder()
        .setColor(`#${getRandomColor()}`) // Color
        .setTitle(`!Aqui estan mis comandos¡`)
        .setDescription(`\n!help ***Para ver esta guia!***\n!sorteo ***Para iniciar un nuevo sorteo!***\n!clean ***Para limpiar los ultimos 100 msg del canal***\n\nAdicional trae un sistema de ticket y sistema de bienvenidas. `)
        .setTimestamp()

        try {
            await message.channel.send({ embeds: [helpEmbed]});
        } catch (err) {
            console.error('Error al responder al help:', err);
            message.channel.send('❌ Hubo un error al intentar ejectutar help.');
        }

    },
};