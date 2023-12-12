// Typedef
/**
 * @typedef {import('../../handlers/Client')} PH
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction 
 */

// Variables
const config = require("../../settings/config");


module.exports = {
    name: "boydev",
    description: `Command for bot devs`,
    userPermissions: ["SEND_MESSAGES"],
    botPermissions: ["EMBED_LINKS"],
    category: "Dev",
    type: "CHAT_INPUT",
    options: [
        {
            name: "command",
            description: "Choose ya queer :3",
            type: 4,
            required: true,
            choices: [
                {
                    name: "reset interaction_db",
                    value: 1,
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
        const devs = config.developers;

        if (devs.includes(author)) {
            const devCommand = interaction.options.getInteger("command");
            if (devCommand == 1) {
                await client.interaction_db.delete(client.interaction_db.all)
                interaction.followUp({ content: "yuh uh", ephemeral: true });
            }
            // adding more soon. give ideas Petah
        } else {
            let replies = ["Sorry.. who are you?", "Nuh uh you ain't a dev", "Nuh uh"];
            let randomMessage = Math.floor(Math.random() * replies.length);
            interaction.followUp({ content: replies[randomMessage], ephemeral: true });
            return;
        }
    },
}