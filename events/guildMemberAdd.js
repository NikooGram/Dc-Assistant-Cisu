const { handleWelcome} = require('../systems/welcome');

module.exports = {
    name: 'guilMemberAdd',
    async execute(member) {
        await handleWelcome(member);
    }
}