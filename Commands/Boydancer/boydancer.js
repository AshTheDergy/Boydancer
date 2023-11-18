// Typedef
/**
 * @typedef {import('../../handlers/Client')} PH
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction 
 */

// Imports
const util = require('util');
const humanizeDuration = require('humanize-duration');
const { cooldownUser } = require("../../functions/CommonFunctions");

// Variables
const cooldowns = new Map();
const config = require("../../settings/config");

// Handlers
const { isWorkingLink_SoundCloud, handleSoundCloud, getSoundCloudLink } = require("../../functions/SoundCloud");
const { isWorkingLink_Youtube, handleYouTube, getYoutubeLink } = require("../../functions/YouTube");
const { handleURL } = require("../../functions/AudioURL");
const { handleFile } = require('../../functions/AudioFile');
const { handleSearch } = require('../../functions/YouTubeSearch');
const { handleSpotify, getSpotifyLink } = require('../../functions/Spotify');

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
                    name: "boybullying (bpm: 100)",
                    value: 3,
                },
                {
                    name: "boyoriginal (bpm: 120)",
                    value: 4,
                },
                {
                    name: "boyyaydancer (bpm: 155)",
                    value: 5,
                },
                {
                    name: "boysinger (bpm: 99)",
                    value: 6,
                },
                {
                    name: "boyhappysing (bpm: 149)",
                    value: 7,
                },
                /*{
                    name: "derg",
                    value: 11,
                }*/
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
        {
            name: "volume",
            description: config.strings.options.volume,
            type: 4,
        },
        {
            name: "troll",
            description: config.strings.options.troll,
            type: 5,
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
            if (Object.hasOwn(data, key)) {
                whiteListed.push(`${data[key].userId}`);
            }
        }

        // Cooldowning
        const cooldown = cooldowns.get(author);
        cooldownUser(cooldowns, interaction, 1);

        // Check if User already has an active running Interaction logged in the DB
        if (await client.interaction_db.has(author)) {
            interaction.reply({ content: "Whoa there buddy slow down. Please wait for your previous Boydancer Video to finish generating.", ephemeral: true });
            return;
        }

        if (cooldown && !whiteListed.includes(author)) {
            const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
            interaction.reply({ content: util.format(config.strings.cooldown, remaining), ephemeral: true });
            return;
        }

        if (!audioUrl && !audioFile && !searchTitle) {
            interaction.reply({ content: util.format(config.strings.error.invalid_everything, config.emoji.error), ephemeral: true });
            cooldownUser(cooldowns, interaction, 10);
            return;
        }
        
        if (audioUrl && !audioFile && !searchTitle) {
            if (!audioUrl.toLowerCase().startsWith("https://")) {
                interaction.reply({ content: util.format(config.strings.error.invalid_link_http, config.emoji.error), ephemeral: true });
                cooldownUser(cooldowns, interaction, 10);
                return;
            }
            
            const youtubeLink = getYoutubeLink(audioUrl);
            if (youtubeLink) {
                if (isWorkingLink_Youtube(youtubeLink)) {
                    handleYouTube(client, interaction, youtubeLink, cooldowns);
                } else {
                    interaction.reply({ content: util.format(config.strings.error.youtube_video_does_not_exist, config.emoji.error), ephemeral: true });
                    cooldownUser(cooldowns, interaction, 10);
                }
                return;
            }

            const soundCloudLink = getSoundCloudLink(audioUrl);
            if (soundCloudLink) {
                if (isWorkingLink_SoundCloud(soundCloudLink)) {
                    handleSoundCloud(client, interaction, soundCloudLink, cooldowns);
                } else {
                    interaction.reply({ content: util.format(config.strings.error.invalid_link_soundcloud, config.emoji.error) });
                    cooldownUser(cooldowns, interaction, 10);
                }
                return;
            }
            
            const spotifyLink = getSpotifyLink(audioUrl);
            if (spotifyLink != null) {
                handleSpotify(client, interaction, spotifyLink, cooldowns);
                return;
            }
            
            if (correctFile.some(extension => audioUrl.endsWith(extension))) {
                handleURL(client, interaction, audioUrl, cooldowns);
                return;
            } 

            interaction.reply({ content: util.format(config.strings.error.invalid_link, config.emoji.error), ephemeral: true });
            cooldownUser(cooldowns, interaction, 10);
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
