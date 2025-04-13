const { EmbedBuilder } = require('discord.js');
const config = require('../config');

// Evento de bienvenida
async function handleWelcome(member) {
    const channel = member.guild.channels.cache.get(config.channels.welcome);
    if (!channel) return;

    // Actualizar contador de users
    const updateGuild = await member.guild.fetch();

    // Crear embet 
    const embed = new EmbedBuilder()
        .setColor('#00FFCC') // Color
        .setTitle(`¡Bienvenidx al servidor!`)
        .setDescription(`Hola <@${member.id}>, estamos felices de tenerte en **${member.guild.name}**. ¡Disfruta tu estancia aquí!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Foto del user
        .setTimestamp()
        .setFooter({ text: `Miembro número ${updateGuild.memberCount}` });

    // Enviar el mensaje
    channel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = {
    handleWelcome,
};