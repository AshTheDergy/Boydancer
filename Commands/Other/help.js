const {CommandInteraction, EmbedBuilder} = require('discord.js');
const PH = require("../../handlers/Client");

module.exports = {
    name: "help",
    description: "See how to use boydancer and more!",
    userPermissions: ['SEND_MESSAGES'],
    botPermissions: ["EMBED_LINKS"],
    cooldown: 10,
    type: "CHAT_INPUT",
    options: [
        {
            name: "boydancer",
            description: "See how to use boydancer and more!",
            type: 1,
        },
    ],

    
    /**
    * @param {PH} client
    * @param {CommandInteraction} interaction
    */

    run: async (client, interaction) => {

        const bugs = await client.bugs.size;
        const allguilds = client.guilds.cache.size;
        const botuptime = `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`;
        const correctFile = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"];

        let helpEmbed = new EmbedBuilder()
        .setDescription(
            `** How to use \`/boydancer\` options\n\`File\` - Select this if you want to use a local file (video or audio)\n\`Link\` - Select this if you want to use a youtube or file link (video or audio)\n||~~Selecting both won't work and will make the bot confused~~||\n\`Start\` - Select this to add a start time from the source audio/video (e.g. 0:24, 2:52)\n\`End\` - Select this to add a end time from the source audio/video (e.g. 0:24, 2:52)\n__!!!MAX UPLOAD VIDEO LENGTH IS 10 MINUTES AND MAX BOYDANCER VIDEO LENGTH IS 1 MINUTE!!!__\n\nSupported Files:\n**\`${correctFile.join('\`, \`')}\``
        )
        .addFields([
            {
                name: `Other info`,
                value: `>>> ** <:inthezone:1145609078891106334> \`${allguilds}\` Guilds \n <a:spinmerightround:1145609663824527360> ${botuptime} Uptime \n <:6969iq:1145609956490481724> \`${client.ws.ping}\` Ping \n <:boythinker:1146052187118637157> \`${client.config.news.version}\` Version \n Premium (coming soon)**\nUse \`/report bug\` to report bugs and other stuff! ${bugs > 0 ? `currently \`${bugs}\` bugs` : " "}` },
            {
              	name: `What's new?`,
                value: `${client.config.news.new.join('\n')}`
            },
        ])
        .setColor('#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padEnd(6, '0'))
        .setThumbnail('https://cdn.discordapp.com/attachments/873603423998705718/1145618819876921416/fZRZQdu.gif')
        .setAuthor({
            name: client.user.tag,
            iconURL: client.user.displayAvatarURL({dynamic:true})
        })
        .setFooter(client.getFooter(interaction.user));

        interaction.reply({
            embeds: [helpEmbed],
            ephemeral: true, //you can turn this to false if you wish others to see the help command
        });
    },
}
