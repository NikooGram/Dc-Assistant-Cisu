const { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Enviar mensaje estático con botón de ticket
async function sendTicketMessage(client) {
    const channel = await client.channels.fetch(config.channels.support);

    const ticketButton = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Abrir Ticket')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(ticketButton);

    channel.send({
        content: '¡Hola! Si necesitas ayuda, puedes abrir un ticket haciendo clic en el botón de abajo.',
        components: [row],
    });
}

// Gestión de interacciones relacionadas con tickets
async function handleTicketInteraction(interaction, client) {
    if (interaction.customId === 'create_ticket') {
        const existing = interaction.guild.channels.cache.find(c =>
            c.name === `ticket-${interaction.user.username.toLowerCase()}`
        );

        if (existing) {
            return interaction.reply({
                content: `❗ Ya tienes un ticket abierto: <#${existing.id}>`,
                ephemeral: true,
            });
        }

        try {
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: process.env.TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: process.env.STAFF_ROLE_ID,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ManageChannels,
                        ],
                    },
                ],
            });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Cerrar ticket')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({
                content: `🎟️ ¡Hola ${interaction.user.username}, tu ticket ha sido creado! Un miembro del staff te ayudará pronto.`,
                components: [row],
            });

            await interaction.reply({
                content: `Tu ticket ha sido creado: <#${ticketChannel.id}>`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error al crear el ticket:', error);
            await interaction.reply({
                content: '❌ Ocurrió un error al crear el ticket. Intenta de nuevo más tarde.',
                ephemeral: true,
            });
        }
    } else if (interaction.customId === 'close_ticket') {
        await interaction.reply({
            content: '🔒 Cerrando ticket...',
            ephemeral: true,
        });

        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: 100 });
        const messagesContent = messages.map(m => `${m.author.tag}: ${m.content}`).join('\n');

        const filePath = path.join(__dirname, '../transcripts', `${channel.name}-transcript.txt`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        try {
            fs.writeFileSync(filePath, messagesContent);
            console.log(`Archivo guardado en: ${filePath}`);
        } catch (err) {
            console.error('Error al escribir el archivo de transcript:', err);
            return;
        }

        const registroChannel = interaction.guild.channels.cache.find(c =>
            c.name === config.channels.transcriptLog && c.type === ChannelType.GuildText
        );
        if(registroChannel) {
            try {
                await registroChannel.send({
                    content: `📜 Transcript del ticket <#${channel.name}>:`,
                    files: [filePath],
                });
                console.log('Archivo enviado al canal de registro');
            } catch (err) {
                console.error('Error al enviar el archivo al canal de registro:', err);
            }
        } else {
            console.error('No se encontró el canal de registro.');
        }

        setTimeout(() => {
            channel.delete().catch(console.error);
        }, 5000);
    }
}

module.exports = {
    sendTicketMessage,
    handleTicketInteraction,
};