const fs = require('fs');
const util = require('util');
const { CommandInteraction } = require("discord.js");
const PH = require("../../handlers/Client");
const cooldowns = new Map();
const humanizeDuration = require('humanize-duration');
const { cooldownUser } = require("../../functions/CommonFunctions");
const { isWorkingLink_SoundCloud, isSoundCloudLink, handleSoundCloud } = require("../../functions/SoundCloud");
const { isWorkingLink_Youtube, isYoutubeLink, handleYouTube } = require("../../functions/YouTube");
const { handleURL } = require("../../functions/AudioURL");

module.exports = {
    name: "boydancer",
    description: `Apply audio to the boykisser dancing video. Maximum of 120 seconds`,
    userPermissions: ['SEND_MESSAGES'],
    botPermissions: ["EMBED_LINKS"],
    type: "CHAT_INPUT",
    options: [
        {
            name: "viber",
            description: "Select your background Viber",
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
                    name: "derg",
                    value: 11,
                }
            ]
        },
        {
            name: "file",
            description: "A file (.mp3, .mp4, etc)",
            type: 11,
        },
        {
            name: "link",
            description: "A video/song link (youtube, soundcloud and file links only)",
            type: 3,
        },
        {
            name: "search",
            description: "Search by a YouTube video title",
            type: 3,
        },
        {
            name: "start",
            description: "(format 0:00) Leaving this blank will cause it to use the audio from 0:00",
            type: 3,
        },
        {
            name: "end",
            description: "(format 0:00) Leaving this blank will make the video 1 minute long (10 minute for premium)",
            type: 3,
        },
        {
            name: "speed",
            description: "Choose audio speed percentage (50% - 200%)",
            type: 4,
        },
        {
            name: "bpm",
            description: "Choose Viber bpm (beats per minute) (max 500)",
            type: 4,
        },
    ],

    /**
    * @param {PH} client
    * @param {CommandInteraction} interaction
    */
    run: async (client, interaction) => {

        //command usage count tracking

        let used = await client.usage.get(`${interaction.guildId}.${interaction.user.id}`);
        if (!used) {
            await client.usage.set(`${interaction.guildId}.${interaction.user.id}.username`, interaction.user.username);
            await client.usage.set(`${interaction.guildId}.${interaction.user.id}.userId`, interaction.user.id);
        } else if (used.username !== interaction.user.username) {
            client.usage.set(`${interaction.guildId}.${interaction.user.id}.username`, interaction.user.username);
        }

        const usedSuccessful = used?.successful;
        const usedAll = used?.all;
        await usedAll ? await client.usage.inc(`${interaction.guildId}.${interaction.user.id}.all`) : await client.usage.set(`${interaction.guildId}.${interaction.user.id}.all`, 1);

        //premium users

        const whiteListed = client.config.whitelisted;
        const data = await client.premium.values;
        for (const key in data) {
    		if (data.hasOwnProperty(key)) {
        		whiteListed.push(`${data[key].userId}`);
    		}
	    }

        //cooldowning
        const author = interaction.user.id;
        const cooldown = cooldowns.get(author);
        cooldownUser(cooldowns, interaction, 1);

        //values
        const audioFile = interaction.options.getAttachment('file');
        const audioUrl = interaction.options.getString("link");
        const searchTitle = interaction.options.getString("search");
        const startTime = interaction.options.getString("start");
        const endTime = interaction.options.getString("end");
        const selectedSpeed = interaction.options.getInteger("speed");
        const beatsPerMin = interaction.options.getInteger("bpm");
        const viber = interaction.options.getInteger("viber");

        //other variables
        const correctFile = client.config.correctFile;
        const emojiError = client.config.emoji.error;

        //important timing stuff
        const beat = viber == 1 ? 155 : 2 ? 155 : 100;
        var danceStart = 0;
        var danceEnd = whiteListed.includes(author) ? client.config.danceEnd_Premium : client.config.danceEnd_Normal;
        const maxInput = whiteListed.includes(author) ? client.config.maxInput_Premium : client.config.maxInput_Normal;
        const maxMinute = whiteListed.includes(author) ? client.config.maxMinute_Premium : client.config.maxMinute_Normal;
        const audioSpeed = selectedSpeed ? selectedSpeed : 100;

        //files
        const backgroundViber = `./files/permanentFiles/back${viber}.mp4`;
        const outputVideoPath = `./files/temporaryFinalVideo/${author}.mp4`;
        const tempYoutubePath = `./files/temporaryYoutube/${author}.wav`;
        const tempVideoPath = `./files/otherTemp/${author}.mp4`;

        //strings
        const finalFileName = viber == 1 ? `Boydancer` : viber == 2 ? `Boyviber` : `gaysex`;
        const generationString = client.config.strings.generation;
        const finalMessage = `${interaction.user}${beatsPerMin > 225  && viber == 1 ? client.config.strings.epilepsy : '\n'}${client.config.strings.finished}`;

        if (cooldown && !whiteListed.includes(author)) {
            const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
            interaction.reply({content: util.format(client.config.strings.cooldown, remaining), ephemeral: true});
            return;
        } else if (!audioUrl && !audioFile && !searchTitle) {
            interaction.reply({content: util.format(client.config.strings.error.invalid_everything, client.config.emoji.error), ephemeral: true});
            cooldownUser(cooldowns, interaction, 10);
            return;
        } else if (audioUrl && !audioFile && !searchTitle) {
            if (!audioUrl.toLowerCase().startsWith("https://")) {
                interaction.reply({content: util.format(client.config.strings.error.invalid_link, client.config.emoji.error), ephemeral: true});
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (isYoutubeLink(audioUrl)) {
                if (isWorkingLink_Youtube(audioUrl)) {
                    handleYouTube(client, interaction, audioUrl, cooldowns);
                } else {
                    interaction.reply({content: util.format(client.config.strings.error.youtube_video_does_not_exist, client.config.emoji.error), ephemeral: true});
                    cooldownUser(cooldowns, interaction, 10);
                    return;
                }
            } else if (isSoundCloudLink(audioUrl)) {
                if (isWorkingLink_SoundCloud(audioUrl)) {
                    handleSoundCloud(client, interaction, audioUrl, cooldowns);
                } else {
                    interaction.reply({ content: util.format(client.config.strings.error.invalid_link_soundcloud, client.config.emoji.error), ephemeral: true });
                    cooldownUser(cooldowns, interaction, 10);
                    return;
                }
            } else if (correctFile.some(extension => audioUrl.endsWith(extension))) {
                handleURL(client, interaction, audioUrl, cooldowns);
            } else {
                interaction.reply({content: util.format(client.config.strings.error.invalid_link, client.config.emoji.error), ephemeral: true});
                cooldownUser(cooldowns, interaction, 10);
                return;
            }
        } else if (!audioUrl && audioFile && !searchTitle) {
            const file = audioFile.url;
            const fileName = audioFile.name;
            if (audioFile.size >= 50000000) {
                interaction.reply({content: `${emojiError} - The File you provided is over __50 MB__`, ephemeral: true});
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (!correctFile.some(extension => fileName.endsWith(extension))) {
                interaction.reply({content: `${emojiError} - Please use a correct File (use \`/help boydancer\` for more information)`, ephemeral: true});
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else {
                const length = await getVideoDuration(file);
                if (startTime && endTime) {
                    const start = giveSecondsFromTime(startTime);
                    const end = giveSecondsFromTime(endTime);
                    if (start > length || end > length) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (start >= end) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (start + danceEnd < end) {
                        interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (start === end) {
                        interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (start === 0 && end) {
                        danceStart = 0;
                        danceEnd = end;
                    } else if (start && end) {
                        danceStart = start;
                        danceEnd = end;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    }
                } else if (!startTime && endTime) {
                    const end = giveSecondsFromTime(endTime);
                    if (end > length) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (end === 0) {
                        interaction.reply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (end <= danceEnd) {
                        danceEnd = end;
                    } else if (end > danceEnd) {
                        danceStart = end - danceEnd;
                        danceEnd = end;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    }
                } else if (startTime && !endTime) {
                    const start = giveSecondsFromTime(startTime);
                    if (start > length) {
                        interaction.reply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    } else if (start === 0) {
                        danceStart = start;
                    } else if (start + danceEnd > length) {
                        danceStart = start;
                        danceEnd = length;
                    } else if (start) {
                        danceStart = start;
                        danceEnd = start + danceEnd;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ time **`, ephemeral: true});
                        cooldownUser(cooldowns, interaction, 10);
                        return;
                    }
                }

                interaction.reply({content: generationString});
                cooldownUser(author, 5);
                try {
                    await applyAudioWithDelay(file, danceStart, length < danceEnd ? length : danceEnd, whiteListed.includes(interaction.user.id) ? 100 : 5000);
                    await interaction.editReply({content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4`}]});
                    fs.unlinkSync(outputVideoPath);
                    cooldownUser(author, 60);
                    await client.usage.set(`${interaction.guildId}.${interaction.user.id}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);
                } catch (error) {
                    console.error('Error generating the video:', error);
                    interaction.followUp('An error occurred while generating the video. (Make sure the Video is not Age Restricted)');
                    cooldownUser(cooldowns, interaction, 10);
                    if (beatsPerMin) {
                        fs.unlinkSync(tempVideoPath);
                    }
                }
            }
        } else if (!audioUrl && !audioFile && searchTitle) {
            interaction.reply({content: generationString});
            const info = await findVideoUrl(searchTitle);
            if (info.seconds == 0) {
                interaction.editReply({content: `:blush: ** **- ** Please ensure the __Youtube Video__ is not a __Livestream__ **`, ephemeral: true});
                interaction.followUp({content: `Or the video doesn't exist :<`, ephemeral: true});
            } else {
                const length = info.seconds;
                if (length > maxInput) {
                    interaction.editReply({content: `${emojiError} - ** Please ensure that the __YouTube Video__ is __10 minutes (600 seconds)__ or shorter **`, ephemeral: true});
                    cooldownUser(cooldowns, interaction, 10);
                } else {
                    if (startTime && endTime) {
                        const start = giveSecondsFromTime(startTime);
                        const end = giveSecondsFromTime(endTime);
                        if (start > length || end > length) {
                            interaction.editReply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (start >= end) {
                            interaction.editReply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (start + danceEnd < end) {
                            interaction.editReply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (start === end) {
                            interaction.editReply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (start === 0 && end) {
                            danceStart = 0;
                            danceEnd = end;
                        } else if (start && end) {
                            danceStart = start;
                            danceEnd = end;
                        } else {
                            interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        }
                    } else if (!startTime && endTime) {
                        const end = giveSecondsFromTime(endTime);
                        if (end > length) {
                            interaction.editReply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (end === 0) {
                            interaction.editReply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (end <= danceEnd) {
                            danceEnd = end;
                        } else if (end > danceEnd) {
                            danceStart = end - danceEnd;
                            danceEnd = end;
                        } else {
                            interaction.editReply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        }
                    } else if (startTime && !endTime) {
                        const start = giveSecondsFromTime(startTime);
                        if (start > length) {
                            interaction.editReply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        } else if (start === 0) {
                            danceStart = start;
                        } else if (start + danceEnd > length) {
                            danceStart = start;
                            danceEnd = length;
                        } else if (start) {
                            danceStart = start;
                            danceEnd = start + danceEnd;
                        } else {
                            interaction.editReply({content: `${emojiError} - ** Please insert a correct __START__ time **`, ephemeral: true});
                            cooldownUser(cooldowns, interaction, 10);
                            return;
                        }
                    }

                    const videoUrl = info.url;
                    await downloadYoutubeVideo(videoUrl);
                    cooldownUser(cooldowns, interaction, 5);
                    try {
                        await applyAudioWithDelay(tempYoutubePath, danceStart, length < danceEnd ? length : danceEnd, 8000);
                        await interaction.editReply({content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4`}]});
                        fs.unlinkSync(outputVideoPath);
                        fs.unlinkSync(tempYoutubePath);
                        cooldownUser(author, 60);
                        await client.usage.set(`${interaction.guildId}.${interaction.user.id}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);
                    } catch (error) {
                        console.error('Error generating the video:', error);
                        interaction.followUp('An error occurred while generating the video. (Make sure the Video is not Age Restricted)');
                        cooldownUser(cooldowns, interaction, 10);
                        fs.unlinkSync(tempYoutubePath);
                        if (beatsPerMin) {
                            fs.unlinkSync(tempVideoPath);
                        }
                    }
                }
            }
        } else {
            let replies = [`Ha Ha very funny. "lem e putt .gsgl gggmgm as jok" :nerd::nerd::nerd:`, `No...`, `Kindly deactive yourself :blush:`, `Mods, crush his skull`, `I'm gonna fuck your mother`, `hey buddy. we're going to kill you and leave you laid out in a dumpster to rot`, `https://cdn.discordapp.com/attachments/873603423998705718/1145258850132443206/8apAlKE.gif`, `https://cdn.discordapp.com/attachments/873603423998705718/1145258963676430346/cqtykgb.gif`, `https://cdn.discordapp.com/attachments/873603423998705718/1145985376515788800/pjSHLOr.png`];
            let randomMessage = Math.floor(Math.random() * replies.length);
            interaction.reply(replies[randomMessage]);
            cooldownUser(author, 60);
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
