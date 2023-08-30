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

        const bugs = client.bugs.size;
        const allguilds = client.guilds.cache.size;
        const botuptime = `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`;
        const correctFile = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"];
        
        let supporters = [];
        const data = await client.premium.values;
        for (const key in data) {
    		if (data.hasOwnProperty(key)) {
        		const user = data[key];
        		const userString = `${user.name} (<@${user.userId}>)`;
        		supporters.push(userString);
    		}
		}

        let helpEmbed = new EmbedBuilder()
        .setDescription(
            `# How to use \`/boydancer\` options
            **\`File\` - Select this if you want to use a local file (video or audio)
            \`Link\` - Select this if you want to use a youtube or file link (video or audio)
            \`Start\` - Select this to add a start time from the source audio/video (e.g. 0:24, 2:52)
            \`End\` - Select this to add a end time from the source audio/video (e.g. 0:24, 2:52)
            __MAX UPLOAD VIDEO LENGTH IS 10 MINUTES!!!__
            __MAX BOYDANCER VIDEO LENGTH IS 1 MINUTE!!!__**
            
            ### Supported Files:
            \`${correctFile.join('\`, \`')}\``
        )
        .addFields([
            {
                name: `Other info`,
                value:
                ` **> <:6969iq:1145609956490481724> \`${client.ws.ping}\` Ping
                > <a:spinmerightround:1145609663824527360> ${botuptime} Uptime
                > <:inthezone:1145609078891106334> \`${allguilds}\` Guilds
                > Use \`/report bug\` to report bugs and other stuff! ${bugs > 0 ? `currently \`${bugs}\` bugs` : " "}
                [Support me!](https://ko-fi.com/ashthedergy)**
                
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
            iconURL: client.user.displayAvatarURL({dynamic:true})
        });

        interaction.reply({
            embeds: [helpEmbed],
            ephemeral: true,
        });
    },
};
