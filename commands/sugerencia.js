const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const getRandomColor = require('../utils/getRandomColor');
const config = require('../config');

// Guardamos votos por mensaje
const votosPorMensaje = new Map();


module.exports = {
    name: 'sugerencia',
    description: 'Envía una sugerencia.',
    async execute(message, args) {
        const suggestionContent = args.join(' ');
        if (!suggestionContent) {
            return message.reply('Por favor, proporciona el contenido de tu sugerencia.');
        }

        const suggestionChannel = message.guild.channels.cache.get(config.channels.sugerenciaLog);
        if (!suggestionChannel) return message.reply('No se pudo encontrar el canal de sugerencias.');

        const sugerenciaEmbed = new EmbedBuilder()
            .setColor(`#${getRandomColor()}`)
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.displayAvatarURL(),
            })
            .setTitle('Nueva Sugerencia')
            .setDescription(suggestionContent)
            .addFields({ name: 'Votos', value: '👍: 0\n👎: 0' })
            .setFooter({ text: `Nueva sugerencia!!` })
            .setTimestamp();

        const botonesInteraccion = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('vote_up').setStyle(ButtonStyle.Success).setEmoji('👍'),
            new ButtonBuilder().setCustomId('vote_down').setStyle(ButtonStyle.Danger).setEmoji('👎'),
            new ButtonBuilder().setCustomId('vote_view').setStyle(ButtonStyle.Secondary).setEmoji('📄'),
            new ButtonBuilder().setCustomId('vote_delete').setStyle(ButtonStyle.Secondary).setLabel('🗑️')
        );

        const suggestionMessage = await suggestionChannel.send({ embeds: [sugerenciaEmbed], components: [botonesInteraccion] });

        // Guardamos la info
        votosPorMensaje.set(suggestionMessage.id, {
            up: new Set(),
            down: new Set(),
            autorId: message.author.id,
        });

        try {
            await message.author.send('✅ Tu sugerencia ha sido enviada correctamente.');
        } catch (error) {
            console.error('No se pudo enviar un mensaje privado al usuario:', error);
            await message.reply('✅ Tu sugerencia ha sido enviada correctamente, pero no pude enviarte un mensaje privado.');
        }

        // Eliminar el mensaje del usuario
        await message.delete();
        
    },

    async handleInteraction(interaction) {
        const { customId, message, user, member } = interaction;
        const votos = votosPorMensaje.get(message.id);
        if (!votos) return;

        // ------ VOTOS ------
        if (customId === 'vote_up' || customId === 'vote_down') {
            votos.up.delete(user.id);
            votos.down.delete(user.id);
            if (customId === 'vote_up') votos.up.add(user.id);
            if (customId === 'vote_down') votos.down.add(user.id);

            const votosEmbed = EmbedBuilder.from(message.embeds[0])
                .spliceFields(0, 1, {
                    name: 'Votos',
                    value: `👍: ${votos.up.size}\n👎: ${votos.down.size}`
                });

            return interaction.update({ embeds: [votosEmbed] });
        }

        // ------ VER VOTOS ------
        if (customId === 'vote_view') {
            const listaUp = [...votos.up].map(id => `<@${id}>`).join('\n') || 'Nadie ha votado 👍';
            const listaDown = [...votos.down].map(id => `<@${id}>`).join('\n') || 'Nadie ha votado 👎';

            return interaction.reply({
                content: `**👍 A favor:**\n${listaUp}\n\n**👎 En contra:**\n${listaDown}`,
                ephemeral: true
            });
        }

        // ------ ELIMINAR ------
        if (customId === 'vote_delete') {
            const staffRoleId = config.roles.staff; // Sacar id del rol Staff desde el config
            const esAutor = user.id === votos.autorId;
            const esMod = member.roles.cache.has(staffRoleId) || member.permissions.has(PermissionFlagsBits.ManageMessages);
        
            if (!esAutor && !esMod) {
                return interaction.reply({ content: '❌ No tienes permiso para eliminar esta sugerencia.', ephemeral: true });
            }
        
            // Usar interaction.message para acceder al mensaje
            await interaction.message.delete();
            votosPorMensaje.delete(interaction.message.id);
            return interaction.reply({ content: '✅ Sugerencia eliminada.', ephemeral: true });
        }
    }
};
