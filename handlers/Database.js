const Josh = require("@joshdb/core");
const { Client } = require("discord.js");
const provider = require("@joshdb/json");

/**
 *
 * @param {Client} client
 */
module.exports = async (client) => {

    client.bugs = new Josh({
        name: "bugs",
        provider: provider,
        providerOptions: {
            collection: "bugs",
            dbName: client.user.username.replace(" ", ""),
        },
    });

    client.on("guildDelete", async (guild) => {
        if (!guild) return;
        let server = await client.server.get(guild.id);
        if (!server) return;
        await client.server.delete(guild.id);
      });
};
