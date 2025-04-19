const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getRandomColor = require('../utils/getRandomColor');
const config = require('../config'); // Importar configuraciones

module.exports = {
    name: 'sorteo', // Nombre del comando
    description: 'Inicia un sorteo con un premio, duración, número de ganadores y mensaje opcional.',
    async execute(message, args) {
        const staffRoleId = config.roles.staff;
        const logChannelId = config.channels.sorteoLog; // Canal para registrar sorteos

        // Validar si el usuario tiene el rol Staff
        if (!message.member.roles.cache.has(staffRoleId)) {
            return message.reply('❌ No tienes permisos para usar este comando. Solo el Staff puede iniciar sorteos.');
        }

        // Validar argumentos
        if (args.length < 3) {
            return message.reply('❌ Uso incorrecto. Ejemplo: `!sorteo <premio> <duración> <ganadores> [mensaje opcional]`\nDuración debe ser en formato `1h`, `2d`, `30m`. Ganadores debe ser un número entero.');
        }

        const premio = args[0]; // Primer argumento es el premio
        const duracion = args[1]; // Segundo argumento es la duración
        const numGanadores = parseInt(args[2]); // Tercer argumento es el número de ganadores
        const mensajePersonalizado = args.slice(3).join(' '); // Todo después del tercer argumento es el mensaje personalizado (opcional)

        // Validar duración (formato simple: 1h, 2d, 30m)
        const duracionRegex = /^(\d+)([smhd])$/; // Ejemplo: 1h, 30m, 2d
        const match = duracion.match(duracionRegex);
        if (!match) {
            return message.reply('❌ Duración inválida. Usa `s` (segundos), `m` (minutos), `h` (horas) o `d` (días). Ejemplo: `1h`, `30m`, `2d`.');
        }

        const tiempo = parseInt(match[1]);
        const unidad = match[2];
        let duracionMs;

        switch (unidad) {
            case 's': duracionMs = tiempo * 1000; break; // Segundos a milisegundos
            case 'm': duracionMs = tiempo * 60 * 1000; break; // Minutos a milisegundos
            case 'h': duracionMs = tiempo * 60 * 60 * 1000; break; // Horas a milisegundos
            case 'd': duracionMs = tiempo * 24 * 60 * 60 * 1000; break; // Días a milisegundos
            default: return message.reply('❌ Unidad de tiempo no reconocida.');
        }

        // Validar número de ganadores
        if (isNaN(numGanadores) || numGanadores <= 0) {
            return message.reply('❌ El número de ganadores debe ser un número entero mayor a 0.');
        }

        // Confirmación antes de iniciar el sorteo
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🎉 Confirmación del sorteo')
            .setDescription(`**Premio:** ${premio}\n**Duración:** ${duracion}\n**Ganadores:** ${numGanadores}\n**Mensaje:** ${mensajePersonalizado || 'Ninguno'}\n\n✅ ¿Quieres iniciar el sorteo?`)
            .setColor('#00FF00');
            

        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_sorteo').setLabel('✅ Confirmar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_sorteo').setLabel('❌ Cancelar').setStyle(ButtonStyle.Danger),
        );

        const confirmMessage = await message.channel.send({ embeds: [confirmEmbed], components: [confirmButtons] });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm_sorteo') {
                // Iniciar el sorteo
                await interaction.update({ content: '🎉 ¡Sorteo iniciado!', embeds: [], components: [] });

                const embed = new EmbedBuilder()
                    .setColor(`#${getRandomColor()}`) // Color aleatorio
                    .setTitle('🎉 ¡SORTEO!')
                    .setDescription(`**Premio:** ${premio}\n\nReacciona con 🎉 para participar.\n\n⏳ **Duración:** ${duracion}\n👥 **Ganadores:** ${numGanadores}\n**Mensaje:** ${mensajePersonalizado || 'Ninguno'}`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Iniciado por ${message.author.tag}` })
                    .setTimestamp();

                const sorteoMessage = await message.channel.send({ embeds: [embed] });
                await sorteoMessage.react('🎉'); // Agregar la reacción de participación

                // Esperar la duración del sorteo
                setTimeout(async () => {
                    const reaccion = sorteoMessage.reactions.cache.get('🎉');
                    if (!reaccion) {
                        return message.channel.send('❌ No hubo participantes en el sorteo.');
                    }

                    const usuarios = await reaccion.users.fetch();
                    const participantes = usuarios.filter(u => !u.bot); // Excluir bots

                    if (participantes.size === 0) {
                        return message.channel.send('❌ No hubo participantes en el sorteo.');
                    }

                    if (numGanadores > participantes.size) {
                        return message.channel.send('❌ El número de ganadores es mayor que el número de participantes.');
                    }

                    const ganadores = participantes.random(numGanadores); // Elegir múltiples ganadores al azar

                    // Anunciar a los ganadores
                    const embedGanador = new EmbedBuilder()
                        .setColor(`#${getRandomColor()}`) // Color aleatorio
                        .setTitle('🎉 ¡SORTEO FINALIZADO!')
                        .setDescription(`Los ganadores del sorteo de **${premio}** son:\n${ganadores.map(g => `🎊 **${g.tag}**`).join('\n')}`)
                        .setColor('#FFD700')
                        .setFooter({ text: '¡Gracias a todos por participar!' })
                        .setTimestamp();

                    await message.channel.send({ embeds: [embedGanador] });

                    // Notificación directa a los ganadores
                    for (const ganador of ganadores) {
                        ganador.send(`🎉 ¡Felicidades! Has ganado el sorteo de **${premio}** en el servidor **${message.guild.name}**.`).catch(console.error);
                    }

                    // Registrar el sorteo en el canal de logs
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor(`#${getRandomColor()}`) // Color aleatorio
                            .setTitle('📜 Registro de sorteo')
                            .setDescription(`**Premio:** ${premio}\n**Duración:** ${duracion}\n**Participantes:** ${participantes.size}\n**Ganadores:**\n${ganadores.map(g => `🎊 **${g.tag}**`).join('\n')}\n**Mensaje:** ${mensajePersonalizado || 'Ninguno'}`)
                            .setColor('#ADD8E6')
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });
                    } else {
                        console.error('No se encontró el canal de registro de sorteos.');
                    }
                }, duracionMs);
            } else if (interaction.customId === 'cancel_sorteo') {
                await interaction.update({ content: '❌ Sorteo cancelado.', embeds: [], components: [] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                confirmMessage.edit({ content: '⏳ Tiempo de confirmación agotado.', embeds: [], components: [] });
            }
        });
    },
};