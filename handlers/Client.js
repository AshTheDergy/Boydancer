const { Client, Collection, GatewayIntentBits, Partials, User, EmbedBuilder } = require("discord.js");
const Discord = require('discord.js')
const fs = require("fs");
const { options } = require("../settings/config");

class PH extends Client {
  constructor() {
    super({
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
      ],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      shards: "auto",
      failIfNotExists: false,
      allowedMentions: {
        parse: ["everyone", "roles", "users"],
        users: [],
        roles: [],
        repliedUser: false,
      },
    });

    this.events = new Collection();
    this.cooldowns = new Collection();
    this.mcommands = new Collection();
    this.commands = new Collection();
    this.aliases = new Collection();
    this.commandCooldown = new Discord.Collection();
    this.scategories = fs.readdirSync("./Commands");
    this.temp = new Collection();
    this.config = require("../settings/config");
  }

  start(token) {
    ["handler"].forEach((handler) => {
      require(`./${handler}`)(this);
    });
    this.login(token);
  }

  /**
   *
   * @param {User} user
   * @returns
   */
  getFooter(user) {
    let obj = {
      text: `Requested By ${user.tag.endsWith("#0") ? user.tag.slice(0, -2) : user.tag}`,
      iconURL: user.displayAvatarURL(),
    };
    if (options.embedFooter) {
      return obj;
    } else {
      return {
        text: " ",
        iconURL: " ",
      };
    }
  }

  embed(interaction, data) {
    let user = interaction.user ? interaction.user : interaction.author;
    if (interaction.deferred) {
      interaction
        .followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(this.config.embed.color)
              .setDescription(`>>> ${data.substring(0, 3000)}`)
              .setFooter(this.getFooter(user)),
          ],
        })
        .catch((e) => { });
    } else {
      interaction
        .reply({
          embeds: [
            new EmbedBuilder()
              .setColor(this.config.embed.color)
              .setDescription(`>>> ${data.substring(0, 3000)}`)
              .setFooter(this.getFooter(user)),
          ],
        })
        .catch((e) => { });
    }
  }
}

module.exports = PH;