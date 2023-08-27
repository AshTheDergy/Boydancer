const { CommandInteraction } = require("discord.js");
const PH = require("../../handlers/Client");

module.exports = {
  name: "ping",
  description: `idoufgsdgoiua`,
  userPermissions: ["SEND_MESSAGES"],
  botPermissions: ["EMBED_LINKS"],
  category: "Information",
  cooldown: 1,
  type: "CHAT_INPUT",

  /**
  *
  * @param {PH} client
  * @param {CommandInteraction} interaction
  * @param {String[]} args
  */
  run: async (client, interaction, args) => {
      //client.embed(interaction, `Ping: **\`${client.ws.ping}\`**`);
      interaction.followUp({files: ['./files/theboydancer.mp4']})
  },
}