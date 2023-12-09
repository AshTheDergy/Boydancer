// Typedef
/**
 * @typedef {import('../../handlers/Client')} PH
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction 
 */

// Variables
const cooldowns = new Map();
const humanizeDuration = require('humanize-duration');

module.exports = {
    name: "report",
    description: `Report bugs related to Boydancer`,
    userPermissions: ["SEND_MESSAGES"],
    botPermissions: ["EMBED_LINKS"],
    category: "Information",
    type: "CHAT_INPUT",
    options: [
        {
            name: "bug",
            description: "Report bugs related to Boydancer",
            type: 1,
            options: [
                {
                    name: "issue",
                    description: "Describe the issue",
                    type: 3,
                    required: true,
                },
            ],
        },
    ],

    /** 
    * @param {PH} client
    * @param {CommandInteraction} interaction
    */
    run: async (client, interaction) => {
        const author = interaction.user.id;
        const cooldown = cooldowns.get(author);
        if (cooldown && interaction.user.id !== "817843037593403402") {
            const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
            client.embed(
                interaction,
                `You are On Cooldown, wait \`${remaining}\``
            );
        } else {
            const issue = interaction.options.getString("issue");
            const size = await client.bugs.size;
            await client.bugs.set(`${size}.bugs`, `${interaction.user.username} (${interaction.user.id}) - ${issue}`);
            await interaction.followUp(`Bug report has been sent! Thank you!`);
            cooldownUser(cooldowns, author, 1800);
        }

        function cooldownUser(cooldowns, user, time) {
            cooldowns.set(user, Date.now() + time * 1000); //time in seconds
            setTimeout(() => cooldowns.delete(interaction.user.id), time * 1000);
        }
    },
}