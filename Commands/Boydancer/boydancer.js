// Imports
const util = require('util');
const { CommandInteraction } = require("discord.js");
const PH = require("../../handlers/Client");
const humanizeDuration = require('humanize-duration');
const { cooldownUser } = require("../../functions/CommonFunctions");

// Variables
const cooldowns = new Map();
const config = require("../../settings/config");

// Handlers
const { isWorkingLink_SoundCloud, isSoundCloudLink, handleSoundCloud } = require("../../functions/SoundCloud");
const { isWorkingLink_Youtube, isYoutubeLink, handleYouTube } = require("../../functions/YouTube");
const { handleURL } = require("../../functions/AudioURL");
const { handleFile } = require('../../functions/AudioFile');
const { handleSearch } = require('../../functions/YouTubeSearch');

module.exports = {
    name: "boydancer",
    description: config.strings.description,
    userPermissions: ['SEND_MESSAGES'],
    botPermissions: ["EMBED_LINKS"],
    type: "CHAT_INPUT",
    options: [
        {
            name: "viber",
            description: config.strings.options.viber,
            required: true,
            type: 4,
            choices: [
                {
                    name: "boydancer (bpm: 155)",
                    value: 1,
                },
                {
                    name: "boyjammer (bpm: 155)",
                    value: 2,
                },
                {
                    name: "boybullying",
                    value: 3,
                },
                {
                    name: "boyoriginal",
                    value: 4,
                },
                {
                    name: "boyyaydancer",
                    value: 5,
                },
                {
                    name: "boysinger (bpm: 99)",
                    value: 6,
                },
                {
                    name: "derg",
                    value: 11,
                }
            ]
        },
        {
            name: "file",
            description: config.strings.options.file,
            type: 11,
        },
        {
            name: "link",
            description: config.strings.options.link,
            type: 3,
        },
        {
            name: "search",
            description: config.strings.options.search,
            type: 3,
        },
        {
            name: "start",
            description: config.strings.options.start,
            type: 3,
        },
        {
            name: "end",
            description: config.strings.options.end,
            type: 3,
        },
        {
            name: "speed",
            description: config.strings.options.speed,
            type: 4,
        },
        {
            name: "bpm",
            description: config.strings.options.bpm,
            type: 4,
        },
    ],

    /**
    * @param {PH} client
    * @param {CommandInteraction} interaction
    */
    run: async (client, interaction) => {
        // Variables
        const author = interaction.user.id;
        const audioFile = interaction.options.getAttachment('file');
        const audioUrl = interaction.options.getString("link");
        const searchTitle = interaction.options.getString("search");
        const correctFile = config.correctFile;

        // Command usage count tracking
        let used = await client.usage.get(`${interaction.guildId}.${author}`);
        if (!used) {
            await client.usage.set(`${interaction.guildId}.${author}.username`, interaction.user.username);
            await client.usage.set(`${interaction.guildId}.${author}.userId`, author);
        } else if (used.username !== interaction.user.username) {
            client.usage.set(`${interaction.guildId}.${author}.username`, interaction.user.username);
        }

        const usedAll = used?.all;
        await usedAll ? await client.usage.inc(`${interaction.guildId}.${author}.all`) : await client.usage.set(`${interaction.guildId}.${author}.all`, 1);

        // Premium Users
        const whiteListed = config.whitelisted;
        const data = await client.premium.values;
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                whiteListed.push(`${data[key].userId}`);
            }
        }

        // Cooldowning
        const cooldown = cooldowns.get(author);
        cooldownUser(cooldowns, interaction, 1);

        if (cooldown && !whiteListed.includes(author)) {
            const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
            interaction.reply({ content: util.format(config.strings.cooldown, remaining), ephemeral: true });
            return;
        } else if (!audioUrl && !audioFile && !searchTitle) {
            interaction.reply({ content: util.format(config.strings.error.invalid_everything, config.emoji.error), ephemeral: true });
            cooldownUser(cooldowns, interaction, 10);
            return;
        } else if (audioUrl && !audioFile && !searchTitle) {
            if (!audioUrl.toLowerCase().startsWith("https://")) {
                interaction.reply({ content: util.format(config.strings.error.invalid_link, config.emoji.error), ephemeral: true });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (isYoutubeLink(audioUrl)) {
                if (isWorkingLink_Youtube(audioUrl)) {
                    handleYouTube(client, interaction, audioUrl, cooldowns);
                } else {
                    interaction.reply({ content: util.format(config.strings.error.youtube_video_does_not_exist, config.emoji.error), ephemeral: true });
                    cooldownUser(cooldowns, interaction, 10);
                    return;
                }
            } else if (isSoundCloudLink(audioUrl)) {
                if (isWorkingLink_SoundCloud(audioUrl)) {
                    handleSoundCloud(client, interaction, audioUrl, cooldowns);
                } else {
                    interaction.reply({ content: util.format(config.strings.error.invalid_link_soundcloud, config.emoji.error) });
                    cooldownUser(cooldowns, interaction, 10);
                    return;
                }
            } else if (correctFile.some(extension => audioUrl.endsWith(extension))) {
                handleURL(client, interaction, audioUrl, cooldowns);
            } else {
                interaction.reply({ content: util.format(config.strings.error.invalid_link, config.emoji.error), ephemeral: true });
                cooldownUser(cooldowns, interaction, 10);
                return;
            }
        } else if (!audioUrl && audioFile && !searchTitle) {
            handleFile(client, interaction, audioFile, cooldowns);
        } else if (!audioUrl && !audioFile && searchTitle) {
            handleSearch(client, interaction, searchTitle, cooldowns);
        } else {
            let replies = config.strings.random_invalid_replies;
            let randomMessage = Math.floor(Math.random() * replies.length);
            interaction.reply(replies[randomMessage]);
            cooldownUser(cooldowns, interaction, 60);
            return;
        }
    }
};
/*
⣿⣿⡟⡹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⢱⣶⣭⡻⢿⠿⣛⣛⣛⠸⣮⡻⣿⣿⡿⢛⣭⣶⣆⢿⣿
⣿⡿⣸⣿⣿⣿⣷⣮⣭⣛⣿⣿⣿⣿⣶⣥⣾⣿⣿⣿⡷⣽⣿
⣿⡏⣾⣿⣿⡿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⣿⣿
⣿⣧⢻⣿⡟⣰⡿⠁⢹⣿⣿⣿⣋⣴⠖⢶⣝⢻⣿⣿⡇⣿⣿
⠩⣥⣿⣿⣴⣿⣇⠀⣸⣿⣿⣿⣿⣷⠀⢰⣿⠇⣿⣭⣼⠍⣿
⣿⡖⣽⣿⣿⣿⣿⣿⣿⣯⣭⣭⣿⣿⣷⣿⣿⣿⣿⣿⡔⣾⣿
⣿⡡⢟⡛⠻⠿⣿⣿⣿⣝⣨⣝⣡⣿⣿⡿⠿⠿⢟⣛⣫⣼⣿
⣿⣿⣿⡷⠝⢿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣾⡩⣼⣿⣿⣿⣿⣿
⣿⣿⣯⡔⢛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣭⣍⣨⠿⢿⣿⣿⣿
⣿⡿⢫⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣝⣿
*/
