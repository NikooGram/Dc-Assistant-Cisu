module.exports = {
    name: 'clean', // Nombre del comando
    description: 'Limpia el canal actual.', 
    async execute(message) {
        const staffRoleId = process.env.STAFF_ROLE_ID; // ID del rol Staff puesto en .env
        if (!message.member.roles.cache.has(staffRoleId)) {
            return message.reply('❌ No tienes permisos para usar este comando.');
        }

        try {
            // Eliminar los ultimos 100 mensajes (Editable)
            await message.channel.bulkDelete(100, true);
            await message.channel.send('🧹 Canal limpiado.');
        } catch (err) {
            console.error('Error al limpiar mensajes:', err);
            message.channel.send('❌ Hubo un error al intentar limpiar el canal.');
        }
    },
};