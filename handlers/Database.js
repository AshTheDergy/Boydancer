const Josh = require("@joshdb/core");
const provider = require("@joshdb/json");

/**
 *
 * @param {Client} client
 */
module.exports = async (client) => {

    client.premium = new Josh({
        name: "premium",
        provider: provider,
        providerOptions: {
            collection: "premium",
            dbName: client.user.username.replace(" ", ""),
        },
    });

    client.usage = new Josh({
        name: "usage",
        provider: provider,
        providerOptions: {
            collection: "usage",
            dbName: client.user.username.replace(" ", ""),
        },
    });

    client.bugs = new Josh({
        name: "bugs",
        provider: provider,
        providerOptions: {
            collection: "bugs",
            dbName: client.user.username.replace(" ", ""),
        },
    });

    client.interaction_db = new Josh({
        name: "interaction_db",
        provider: provider,
    });

    client.on("guildDelete", async (guild) => {
        if (!guild) return;
        let server = await client.usage.get(guild.id);
        if (!server) return;
        await client.usage.delete(guild.id);
    });
};
