const { readdirSync } = require("fs");
const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
} = require("discord.js");

const PH = require("./Client");

/**
 *
 * @param {PH} client
 */
module.exports = async (client) => {
  try {
    let allCommands = [];
    readdirSync("./Commands/").forEach((dir) => {
      const commands = readdirSync(`./Commands/${dir}`).filter((f) =>
        f.endsWith(".js")
      );

      for (const cmd of commands) {
        const command = require(`../Commands/${dir}/${cmd}`);
        if (command.name) {
          switch (command.type) {
            case "CHAT_INPUT":
              {
                command.type = ApplicationCommandType.ChatInput;
              }
              break;
            case "MESSAGE":
              {
                command.type = ApplicationCommandType.Message;
              }
              break;
            case "USER":
              {
                command.type = ApplicationCommandType.User;
              }
              break;

            default:
              break;
          }
          if (command.options) {
            command.options.forEach((option) => {
              switch (option.type) {
                case "STRING":
                  {
                    option.type = ApplicationCommandOptionType.String;
                  }
                  break;
                case "NUMBER":
                  {
                    option.type = ApplicationCommandOptionType.Number;
                  }
                  break;
                case "ROLE":
                  {
                    option.type = ApplicationCommandOptionType.Role;
                  }
                  break;
                case "SUB_COMMAND":
                  {
                    option.type = ApplicationCommandOptionType.Subcommand;
                  }
                  break;
                case "SUB_COMMAND_GROUP":
                  {
                    option.type = ApplicationCommandOptionType.SubcommandGroup;
                  }
                  break;

                default:
                  break;
              }
            });
          }
          client.commands.set(command.name, command);
          allCommands.push(command);
        } else {
          console.log(`${cmd} is not ready`);
        }
      }
    });
    console.log(`${client.commands.size} Slash Commands Loaded`);
    client.on("ready", async () => {
      await client.application.commands.set(allCommands);
    });
  } catch (e) {
    console.log(e);
  }

  
    // Loading Event Files
    try {
      let eventCount = 0;
      readdirSync("./events")
        .filter((f) => f.endsWith(".js"))
        .forEach((event) => {
          require(`../events/${event}`);
          eventCount++;
        });
      console.log(`${eventCount} Events Loaded`);
    } catch (e) {
      console.log(e);
    }
  };
  