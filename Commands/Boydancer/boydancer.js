const fs = require('fs');
const { spawn } = require('child_process').spawn;
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { CommandInteraction } = require("discord.js");
const PH = require("../../handlers/Client");
const cooldowns = new Map();
const humanizeDuration = require('humanize-duration');
const scdl = require('soundcloud-downloader').default;
const yts = require('yt-search');

module.exports = {
    name: "boydancer",
    description: `Apply audio to boykisser dancing video max 60 seconds!! (YOUTUBE DOESN'T WORK ATM)`,
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
                    name: "boydancer (bpm: 152)",
                    value: 1,
                },
                {
                    name: "boyjammer (bpm: 152)",
                    value: 2
                },
            ]
        },
        {
            name: "file",
            description: "A file (.mp3, .mp4, etc)",
            type: 11,
        },
        {
            name: "link",
            description: "A video/song link (~~youtube~~, soundcloud and file links only)",
            type: 3,
        },
        {
            name: "search",
            description: "Search for a YouTube video title",
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

        let whiteListed = ['817843037593403402', '358936084278673415'];
        const data = await client.premium.values;
        for (const key in data) {
    		if (data.hasOwnProperty(key)) {
        		whiteListed.push(`${data[key].userId}`);
    		}
		}

        //cooldowning

        const author = interaction.user.id;
        const cooldown = cooldowns.get(author);
        cooldownUser(author, 1);

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

        const correctFile = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"];
        const emojiError = client.config.emoji.error;

        //important timing stuff

        const beat = viber == 1 ? 152 : 152;
        var danceStart = 0;
        var danceEnd = whiteListed.includes(interaction.user.id) ? 480 : 60;
        const maxInput = whiteListed.includes(interaction.user.id) ? 1800 : 600;
        const audioSpeed = selectedSpeed ? selectedSpeed : 100;

        //files

        const backgroundViber = `./files/permanentFiles/back${viber}.mp4`;
        const randomFileName = interaction.user.id;
        const outputVideoPath = `./files/temporaryFinalVideo/${randomFileName}.mp4`;
        const tempYoutubePath = `./files/temporaryYoutube/${randomFileName}.wav`;
        const tempVideoPath = `./files/otherTemp/${randomFileName}.mp4`;

        //strings

        const finalFileName = viber == 1 ? `Boydancer` : viber == 2 ? `Boyviber` : `gaysex`;
        const generationString = `Generating video... <a:boypet2:1146012115451265035>`;
        const finalMessage = `${interaction.user}${beatsPerMin > 225  && viber == 1 ? '\n<:boys:1148620467834474547> EPILEPSY WARNING <:boys:1148620467834474547>\n' : '\n'}Here is your boydancer:`;

        if (cooldown && !whiteListed.includes(interaction.user.id)) {
            const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
            interaction.reply({content: `You are On Cooldown, wait \`${remaining}\``, ephemeral: true});
            return;
        } else if (!audioUrl && !audioFile && !searchTitle) {
            interaction.reply({content: `${emojiError} - ** Please provide a __Link__ or __File__ (use \`/help boydancer\` for more information) **`, ephemeral: true});
            cooldownUser(author, 10);
            return;
        } else if (audioUrl && !audioFile && !searchTitle) {
            if (!audioUrl.toLowerCase().startsWith("https://")) {
                interaction.reply({content: `${emojiError} - ** Please provide a correct link (supported are __Youtube__ __SoundCloud__ and __Audio/Video__ links (use \`/help boydancer\` for more information) **`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            } else if (isYoutubeLink(audioUrl)) {
                if (interaction.user.id !== "817843037593403402") {
                    interaction.reply("broken :<")
                    return;
                } else if (isWorkingLink_Youtube(audioUrl)) {

                        const length = parseInt(await checkYoutubeVideoLength(audioUrl));
                        if (length == "0") {
                        interaction.reply({content: `:blush: ** **- ** Please ensure the __Youtube Video__ is not a __Livestream__ **`, ephemeral: true}); //kys
                        cooldownUser(author, 10);
                        return;
                    	} else if (length > maxInput) {
                            interaction.reply({content: `${emojiError} - ** Please ensure that the __YouTube Video__ is __10 minutes (600 seconds)__ or shorter **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else {
                            if (startTime && endTime) { //kys
                                const start = giveSecondsFromTime(startTime);
                                const end = giveSecondsFromTime(endTime);
                                if (start > length || end > length) {
                                    interaction.reply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (start >= end) {
                                    interaction.reply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (start + danceEnd < end) {
                                    interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (start === end) {
                                    interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (start === 0 && end) {
                                    danceStart = 0;
                                    danceEnd = end;
                                } else if (start && end) {
                                    danceStart = start;
                                    danceEnd = end;
                                } else {
                                    interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                }
                            } else if (!startTime && endTime) {
                                const end = giveSecondsFromTime(endTime);
                                if (end > length) {
                                    interaction.reply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (end === 0) {
                                    interaction.reply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (end <= danceEnd) {
                                    danceEnd = end;
                                } else if (end > danceEnd) {
                                    danceStart = end - danceEnd;
                                    danceEnd = end;
                                } else {
                                    interaction.reply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                }
                            } else if (startTime && !endTime) {
                                const start = giveSecondsFromTime(startTime);
                                if (start > length) {
                                    interaction.reply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                                    cooldownUser(author, 10);
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
                                    cooldownUser(author, 10);
                                    return;
                                }
                            }

                            interaction.reply({content: generationString});
                            await downloadYoutubeVideo(audioUrl);
                            cooldownUser(author, 5);
                            try {
                                await applyAudioWithDelay(tempYoutubePath, danceStart, length < danceEnd ? length : danceEnd, 5000);
                                await interaction.editReply({content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4`}]});
                                fs.unlinkSync(outputVideoPath);
                                fs.unlinkSync(tempYoutubePath);
                                cooldownUser(author, 60);
                                await client.usage.set(`${interaction.guildId}.${interaction.user.id}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);
                            } catch (error) {
                                console.error('Error generating the video:', error);
                                interaction.followUp('An error occurred while generating the video. (Make sure the Video is not Age Restricted)');
                                cooldownUser(author, 10);
                                fs.unlinkSync(tempYoutubePath);
                                if (beatsPerMin) {
                                    fs.unlinkSync(tempVideoPath);
                                }
                            }
                    }
                } else {
                    interaction.reply({content: `${emojiError} - ** The __Youtube Video__ you provided Does Not Exist **`, ephemeral: true});
                    cooldownUser(author, 10);
                    return;
                }
            } else if (isSoundCloudLink(audioUrl)) {
                if (isWorkingLink_SoundCloud(audioUrl)) {
                    const length = await checkSoundCloudLength(audioUrl);
                    if (length > maxInput) {
                        interaction.reply({content: `${emojiError} - ** Please ensure that the __SoundCloud Song__ is __10 minutes (600 seconds)__ or shorter **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else {
                        if (startTime && endTime) {
                            const start = giveSecondsFromTime(startTime);
                            const end = giveSecondsFromTime(endTime);
                            if (start > length || end > length) {
                                interaction.reply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            } else if (start >= end) {
                                interaction.reply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            } else if (start + danceEnd < end) {
                                interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            } else if (start === end) {
                                interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            } else if (start === 0 && end) {
                                danceStart = 0;
                                danceEnd = end;
                            } else if (start && end) {
                                danceStart = start;
                                danceEnd = end;
                            } else {
                                interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            }
                        } else if (!startTime && endTime) {
                            const end = giveSecondsFromTime(endTime);
                            if (end > length) {
                                interaction.reply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            } else if (end === 0) {
                                interaction.reply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            } else if (end <= danceEnd) {
                                danceEnd = end;
                            } else if (end > danceEnd) {
                                danceStart = end - danceEnd;
                                danceEnd = end;
                            } else {
                                interaction.reply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                                cooldownUser(author, 10);
                                return;
                            }
                        } else if (startTime && !endTime) {
                            const start = giveSecondsFromTime(startTime);
                            if (start > length) {
                                interaction.reply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                                cooldownUser(author, 10);
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
                                cooldownUser(author, 10);
                                return;
                            }
                        }

                        await interaction.reply({content: generationString});
                        await downloadSoundCloud(audioUrl);
                        cooldownUser(author, 5);
                        try {
                            await applyAudioWithDelay(tempYoutubePath, danceStart, length < danceEnd ? length : danceEnd, 5000);
                            await interaction.editReply({content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4`}]});
                            fs.unlinkSync(outputVideoPath);
                            fs.unlinkSync(tempYoutubePath);
                            cooldownUser(author, 60);
                            await client.usage.set(`${interaction.guildId}.${interaction.user.id}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);
                        } catch (error) {
                            console.error('Error generating the video:', error);
                            interaction.followUp('An error occurred while generating the video. (Make sure the Video is not Age Restricted)');
                            cooldownUser(author, 10);
                            fs.unlinkSync(tempYoutubePath);
                            if (beatsPerMin) {
                                fs.unlinkSync(tempVideoPath);
                            }
                        }
                    }
                } else {
                    interaction.reply({content: `${emojiError} - ** The __SoundCloud Link__ you provided Does Not Exist. __Shortened Links__ also don't work **`, ephemeral: true});
                    cooldownUser(author, 10);
                    return;
                }
            } else if (correctFile.some(extension => audioUrl.endsWith(extension))) {
                const length = await getVideoDuration(audioUrl);
                if (startTime && endTime) {
                    const start = giveSecondsFromTime(startTime);
                    const end = giveSecondsFromTime(endTime);
                    if (start > length || end > length) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start >= end) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start + danceEnd < end) {
                        interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start === end) {
                        interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start === 0 && end) {
                        danceStart = 0;
                        danceEnd = end;
                    } else if (start && end) {
                        danceStart = start;
                        danceEnd = end;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    }
                } else if (!startTime && endTime) {
                    const end = giveSecondsFromTime(endTime);
                    if (end > length) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (end === 0) {
                        interaction.reply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (end <= danceEnd) {
                        danceEnd = end;
                    } else if (end > danceEnd) {
                        danceStart = end - danceEnd;
                        danceEnd = end;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    }
                } else if (startTime && !endTime) {
                    const start = giveSecondsFromTime(startTime);
                    if (start > length) {
                        interaction.reply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                        cooldownUser(author, 10);
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
                        cooldownUser(author, 10);
                        return;
                    }
                }

                interaction.reply({content: generationString});
                cooldownUser(author, 5);
                try {
                    await applyAudioWithDelay(audioUrl, danceStart, length < danceEnd ? length : danceEnd, whiteListed.includes(interaction.user.id) ? 100 : 5000);
                    await interaction.editReply({content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4`}]});
                    fs.unlinkSync(outputVideoPath);
                    cooldownUser(author, 60);
                    await client.usage.set(`${interaction.guildId}.${interaction.user.id}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);
                } catch (error) {
                    console.error('Error generating the video:', error);
                    interaction.followUp('An error occurred while generating the video. (Make sure the Video is not Age Restricted)');
                    cooldownUser(author, 10);
                    if (beatsPerMin) {
                        fs.unlinkSync(tempVideoPath);
                    }
                }
            } else {
                interaction.reply({content: `${emojiError} - ** Please provide a supported link (supported are __Youtube__, __SoundCloud__ and __Audio/Video__ links (use \`/help boydancer\` for more information) **`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            }
        } else if (!audioUrl && audioFile && !searchTitle) {
            const file = audioFile.url;
            if (audioFile.size >= 50000000) {
                interaction.reply({content: `${emojiError} - The File you provided is over __50 MB__`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            } else if (!correctFile.some(extension => file.endsWith(extension))) {
                interaction.reply({content: `${emojiError} - Please use a correct File (use \`/help boydancer\` for more information)`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            } else {
                const length = await getVideoDuration(file);
                if (startTime && endTime) {
                    const start = giveSecondsFromTime(startTime);
                    const end = giveSecondsFromTime(endTime);
                    if (start > length || end > length) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start >= end) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start + danceEnd < end) {
                        interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start === end) {
                        interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (start === 0 && end) {
                        danceStart = 0;
                        danceEnd = end;
                    } else if (start && end) {
                        danceStart = start;
                        danceEnd = end;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    }
                } else if (!startTime && endTime) {
                    const end = giveSecondsFromTime(endTime);
                    if (end > length) {
                        interaction.reply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (end === 0) {
                        interaction.reply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    } else if (end <= danceEnd) {
                        danceEnd = end;
                    } else if (end > danceEnd) {
                        danceStart = end - danceEnd;
                        danceEnd = end;
                    } else {
                        interaction.reply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                        cooldownUser(author, 10);
                        return;
                    }
                } else if (startTime && !endTime) {
                    const start = giveSecondsFromTime(startTime);
                    if (start > length) {
                        interaction.reply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                        cooldownUser(author, 10);
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
                        cooldownUser(author, 10);
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
                    cooldownUser(author, 10);
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
                    cooldownUser(author, 10);
                } else {
                    if (startTime && endTime) {
                        const start = giveSecondsFromTime(startTime);
                        const end = giveSecondsFromTime(endTime);
                        if (start > length || end > length) {
                            interaction.editReply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else if (start >= end) {
                            interaction.editReply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else if (start + danceEnd < end) {
                            interaction.editReply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else if (start === end) {
                            interaction.editReply({content: `${emojiError} - ** The time between __START__ and __END__ has to be at least \`1\` second **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else if (start === 0 && end) {
                            danceStart = 0;
                            danceEnd = end;
                        } else if (start && end) {
                            danceStart = start;
                            danceEnd = end;
                        } else {
                            interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ and/or __END__ time (use \`/hlep boydancer\` for more information) **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        }
                    } else if (!startTime && endTime) {
                        const end = giveSecondsFromTime(endTime);
                        if (end > length) {
                            interaction.editReply({content: `${emojiError} - ** Please ensure your __END__ time is shorter than the video **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else if (end === 0) {
                            interaction.editReply({content: `The __END__ time can not be \`0\` seconds`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else if (end <= danceEnd) {
                            danceEnd = end;
                        } else if (end > danceEnd) {
                            danceStart = end - danceEnd;
                            danceEnd = end;
                        } else {
                            interaction.editReply({content: `${emojiError} - ** Please insert a correct __END__ time **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        }
                    } else if (startTime && !endTime) {
                        const start = giveSecondsFromTime(startTime);
                        if (start > length) {
                            interaction.editReply({content: `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`, ephemeral: true});
                            cooldownUser(author, 10);
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
                            cooldownUser(author, 10);
                            return;
                        }
                    }

                    const videoUrl = info.url;
                    await downloadYoutubeVideo(videoUrl);
                    cooldownUser(author, 5);
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
                        cooldownUser(author, 10);
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

        // functions

        function cooldownUser(user, time) {
            cooldowns.set(user, Date.now() + time * 1000); //time in seconds
            setTimeout(() => cooldowns.delete(interaction.user.id), time * 1000);
        }

        function giveSecondsFromTime(input) {
            const timePattern = /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            const [minutes, seconds] = input.split(":").map(Number);
            if (!timePattern.test(input)) {
                return false;
            } else if (minutes < 0 || minutes > 9 && seconds > 0 || minutes > 10 || seconds < 0 || seconds > 60) {
                return false;
            } else {
                return seconds + minutes * 60;
            }
        }

        //link functions

        async function getVideoDuration(videoUrl) {
            return new Promise((resolve, reject) => {
                ffmpeg.ffprobe(videoUrl, (err, metadata) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (metadata && metadata.format && metadata.format.duration) {
                        const totalDurationInSeconds = parseFloat(metadata.format.duration);
                        resolve(totalDurationInSeconds.toFixed(1));
                    } else {
                        resolve(null);
                    }
                });
            });
        }

        //audio applying functions

        async function changeVideoBPM(inputVideoPath, tempVid, BPM, duration) {
            return new Promise((resolve, reject) => {
                const ffmpegProcess = ffmpeg()
                    .input(inputVideoPath)
                    .videoFilter(`setpts=${beat / BPM}*PTS`)
                    .outputOptions([`-t ${duration}`, '-y'])
                    .output(tempVid)
                    .on('error', (err) => {
                        reject(err);
                    })
                    .on('end', () => {
                        resolve(tempVid);
                    });
        
                ffmpegProcess.run();
            });
        }

        async function applyAudioToVideoFILE(file, start, end) {
            const normalizedAudioSpeed = Math.min(200, Math.max(50, audioSpeed));
            const calculatedDuration = (end - start) / (normalizedAudioSpeed / 100);
            const duration = calculatedDuration <= danceEnd ? calculatedDuration : danceEnd;
            return new Promise(async (resolve, reject) => {
                if (beatsPerMin) {
                    const bpm = beatsPerMin ? beatsPerMin > 500 ? 500 : beatsPerMin < 50 ? 50 : beatsPerMin : 10000;
                    await changeVideoBPM(backgroundViber, tempVideoPath, bpm, duration);
                }
                const ffmpegProcess = ffmpeg()
                .input(beatsPerMin ? tempVideoPath : backgroundViber)
                .inputOptions(['-ss 0'])
                .input(file)
                .inputOptions(['-ss ' + start.toString()])
                .complexFilter([
                    `[1:a]atempo=${normalizedAudioSpeed / 100},volume=1[music];[music]amix=inputs=1[audioout]`,
                ])
                .outputOptions([
                    '-map 0:v',
                    '-map [audioout]',
                    '-c:v copy',
                    '-c:a aac',
                    '-t ' + duration.toString(),
                    '-y',
                ])
                .output(outputVideoPath)
                .on('error', (err) => {
                    reject(err);
                })
                .on('end', () => {
                    if (beatsPerMin) {
                       fs.unlinkSync(tempVideoPath);
                    }
                    resolve(outputVideoPath);
                });
                ffmpegProcess.run();
            });
        }

        async function applyAudioWithDelay(file, start, end, delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
            await applyAudioToVideoFILE(file, start, end);
        }

        //search functions

        async function findVideoUrl(title) {
            return new Promise(async (resolve, reject) => {
                try {
                    const r = await yts(title);
                    const firstResult = r.videos[0];
                    
                    if (!firstResult) {
                        reject(new Error('Video not found.'));
                    } else {
                        resolve(firstResult);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }

        //youtube functions

        function isYoutubeLink(videoUrl) {
            const patterns = [
                /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=)?[a-zA-Z0-9_-]+&?(?:t=[0-9]+m[0-9]+s)?/,
                /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:shorts\/)?[a-zA-Z0-9_-]+/,
              ];
          
            for (const pattern of patterns) {
                if (pattern.test(videoUrl)) {
                    return true;
                }
            }
            return false;
        }

        function isWorkingLink_Youtube(videoUrl) {
            return ytdl.validateURL(videoUrl);
        }

        async function checkLiveStatus(videoUrl) {
            try {
                const info = await ytdl.getInfo(videoUrl);
                const isLive = info.videoDetails.isLiveContent;
                return isLive;
            } catch (error) {
                console.error(error);
                return false;
            }
        }

        async function checkYoutubeVideoLength(videoUrl) {
            try {
                const info = await ytdl.getBasicInfo(videoUrl);
                const length = info.videoDetails.lengthSeconds;
                return length;
            } catch (error) {
                console.error(error);
                return;
            }
        }

        async function downloadYoutubeVideo(videoUrl) {
            const options = {quality: 'highestaudio'};
            const stream = ytdl(videoUrl, options);
            const outputPath = tempYoutubePath;
            const fileStream = fs.createWriteStream(outputPath);
            stream.pipe(fileStream);
            stream.on('error', (err) => {
            console.error('Error:', err);
            });
        }

        //soundcloud functions

        function isSoundCloudLink(url) {
            const patterns = [
                /^https?:\/\/(soundcloud\.com)\/(.*)$/,
            ];
        
            for (const pattern of patterns) {
                if (pattern.test(url)) {
                    return true;
                }
            }
            return false;
        }

        function isWorkingLink_SoundCloud(Url) {
            return scdl.isValidUrl(Url);
        }

        async function checkSoundCloudLength(Url) {
            try {
                const json = await scdl.getInfo(Url);
                const length = Math.floor(json.full_duration / 1000);
                return length;
            } catch (error) {
                console.error(error);
                return;
            }
        }

        async function downloadSoundCloud(audioUrl) {
            const outputPath = tempYoutubePath;
            const fileStream = fs.createWriteStream(outputPath);
            scdl.downloadFormat(audioUrl, "audio/mpeg").then(stream => stream.pipe(fileStream)).catch(err => console.error('Error:', err));
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
