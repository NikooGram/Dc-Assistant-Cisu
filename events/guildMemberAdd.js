const { handleWelcome } = require('../systems/welcome');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        console.log(`Nuevo miembro detectado: ${member.user.tag}`);
        await handleWelcome(member);
    },
};