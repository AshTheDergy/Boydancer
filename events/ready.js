const { ActivityType } = require("discord.js");
const client = require("../index");

client.on("ready", async () => {
    console.log(`${client.user.username} Is Online`);
    client.user.setActivity({
        name: `With Boykisser`,
        type: ActivityType.Playing,
    });

    await require("../handlers/Database")(client);
});  