const util = require('util');
const client = require("../index");
const { cooldown } = require("../handlers/functions");
const { emoji, strings } = require("../settings/config");
const { ApplicationCommandOptionType } = require("discord.js");

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const cmdName = interaction.commandName;

    if (cmdName === 'help' || cmdName === 'boydancer') {
      const cmd = client.commands.get(cmdName);
      if (!cmd) {
        return client.embed(
          interaction,
          util.format(strings.error.command_not_found, emoji.error, cmdName),
        );
      } else {
        const args = [];
        for (let option of interaction.options.data) {
          if (option.type === ApplicationCommandOptionType.Subcommand) {
            if (option.name) args.push(option.name);
            option.options?.forEach((x) => {
              if (x.value) args.push(x.value);
            });
          } else if (option.value) {
            args.push(option.value);
          }
        }

        if (cooldown(interaction, cmd)) {
          return client.embed(
            interaction,
            util.format(strings.cooldown, cooldown(interaction, cmd).toFixed()),
          );
        } else {
          cmd.run(client, interaction, args);
        }
      }
    } else {
      await interaction.deferReply({ ephemeral: false }).catch(/* GRACEFAIL */);
      const cmd = client.commands.get(cmdName);
      if (!cmd) {
        return client.embed(
          interaction,
          util.format(strings.error.command_not_found, emoji.error, cmdName),
        );
      } else {
        const args = [];
        for (let option of interaction.options.data) {
          if (option.type === ApplicationCommandOptionType.Subcommand) {
            if (option.name) args.push(option.name);
            option.options?.forEach((x) => {
              if (x.value) args.push(x.value);
            });
          } else if (option.value) {
            args.push(option.value);
          }
        }

        if (cooldown(interaction, cmd)) {
          return client.embed(
            interaction,
            util.format(strings.cooldown, cooldown(interaction, cmd).toFixed()),
          );
        } else {
          cmd.run(client, interaction, args);
        }
      }
    }
  }
  if (interaction.isContextMenuCommand()) {
    await interaction.deferReply({ ephemeral: true }).catch(/* GRACEFAIL */);
    const command = client.commands.get(interaction.commandName);
    if (command) command.run(client, interaction);
  }
});
