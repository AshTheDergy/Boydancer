// Typedef
/**
 * @typedef {import('../../handlers/Client')} PH
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction
 */

const { EmbedBuilder } = require('discord.js');
const cooldowns = new Map();

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

        const bugs1 = client.bugs.size;
        const allguilds = client.guilds.cache.size;
        const botuptime = `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`;
        const correctFile = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"];

        let supporters = [];
        const data = await client.premium.values;
        for (const key in data) {
            if (Object.hasOwn(data, key)) {
                const user = data[key];
                const userString = `${user.name} (<@${user.userId}>)`;
                supporters.push(userString);
            }
        }

        let helpEmbed = new EmbedBuilder()
            .setDescription(
                `# How to use \`/boydancer\` options
            **\`Viber\` - Select your background viber
            \`File\` - Select this if you want to use a local file (video or audio)
            \`Link\` - Select this if you want to use a youtube or file link (video or audio)
            \`Search\` - Search titles of youtube videos
            \`Start\` - Select this to add a start time from the source audio/video (e.g. 0:24, 2:52)
            \`End\` - Select this to add a end time from the source audio/video (e.g. 0:24, 2:52)
            \`Speed\` - Select the song speed, input it as a percentage without the percentage symbol (minimum: 50%, maximum: 200%)
            \`BPM\` - Select the Viber bpm (beats per minute) EPILEPSY WARNING (minimum: 50, maximum: 1000)
            \`Volume\` - Choose the volume of the song (10% - 500%)
            \`Modifier\` - Choose a modifier for the video/audio
            __MAX UPLOAD VIDEO LENGTH IS ${client.config.whitelisted.includes(interaction.user.id) ? client.config.maxMinute_Premium : client.config.maxMinute_Normal} MINUTES!!!__
            __MAX BOYDANCER VIDEO LENGTH IS ${client.config.whitelisted.includes(interaction.user.id) ? client.config.danceEnd_Premium/60 : client.config.danceEnd_Normal/60} MINUTES!!!__**

            ### Supported Files:
            \`${correctFile}\``
            )
            .addFields([
                {
                    name: `Other info`,
                    value:
                        ` **> <:6969iq:1168249183111745618> \`${client.ws.ping}\` Ping
                > <a:spinmerightround:1168252685330415637> ${botuptime} Uptime
                > <:inthezone:1168249217005932605> \`${allguilds}\` Guilds ${bugs1 > 0 ? `\n> <:devilish:1168249108511854632> \`${bugs1}\` Current bugs` : " "}
                > Use \`/report bug\` to report bugs and other stuff!
                [Support the Bot Developer / Ash!](https://ko-fi.com/ashthedergy)**

                **HUGE THANKS TO __uwu_peter__ FOR HELP IN DEVELOPING!**`
                },
                {
                    name: `Supporters:`,
                    value: `${supporters.join('\n')}`,
                },
                {
                    name: `What's new? \`${client.config.news.version}\``,
                    value: `${client.config.news.new.join('\n')}`
                },
            ])
            .setColor('#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padEnd(6, '0'))
            .setThumbnail('https://cdn.discordapp.com/attachments/873603423998705718/1145618819876921416/fZRZQdu.gif')
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.displayAvatarURL({ dynamic: true })
            });

        cooldownUser(interaction.user.id, 10);
        interaction.reply({
            embeds: [helpEmbed],
            ephemeral: true,
        });

        function cooldownUser(user, time) {
            cooldowns.set(user, Date.now() + time * 1000); //time in seconds
            setTimeout(() => cooldowns.delete(interaction.user.id), time * 1000);
        }
    },
};