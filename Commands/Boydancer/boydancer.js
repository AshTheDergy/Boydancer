const fs = require('fs');
const { spawn } = require('child_process').spawn;
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { CommandInteraction } = require("discord.js");
const PH = require("../../handlers/Client");
const cooldowns = new Map();
const humanizeDuration = require('humanize-duration');
const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: "boydancer",
    description: `Apply audio to boykisser dancing video max 60 seconds!! (in beta)`,
    userPermissions: ['SEND_MESSAGES'],
    botPermissions: ["EMBED_LINKS"],
    type: "CHAT_INPUT",
    options: [
        {
            name: "file",
            description: "A file (.mp3, .mp4, etc)",
            type: 11,
        },
        {
            name: "link",
            description: "A video/song link (currently youtube, soundcloud and file links only)",
            type: 3,
        },
        {
            name: "start",
            description: "(format 0:00) Leaving this blank will cause it to use the audio from 0:00",
            type: 3,
        },
        {
            name: "end",
            description: "(format 0:00) Leaving this blank will make the video 1 minute long",
            type: 3,
        }
    ],

    /**
    * @param {PH} client
    * @param {CommandInteraction} interaction
    */
    run: async (client, interaction) => {

        const author = interaction.user.id;
        const cooldown = cooldowns.get(author);
        cooldownUser(author, 1);

        const emojiSuccess = client.config.emoji.success;
        const emojiError = client.config.emoji.error;

        const correctFile = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"];

        const audioFile = interaction.options.getAttachment('file');
        const audioUrl = interaction.options.getString("link");
        const startTime = interaction.options.getString("start");
        const endTime = interaction.options.getString("end");

        var danceStart = 0;
        var danceEnd = 60;

        const randomFileName = interaction.user.id;
        const outputVideoPath = `./files/temporaryFinalVideo/${randomFileName}.mp4`;
        const tempYoutubePath = `./files/temporaryYoutube/${randomFileName}.wav`;

        
        if (cooldown && interaction.user.id !== "817843037593403402") {
            const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
            interaction.reply({content: `You are On Cooldown, wait \`${remaining}\``, ephemeral: true});
            return;
        } else if (!audioUrl && !audioFile) {
            interaction.reply({content: `${emojiError} - ** Please provide a __Link__ or __File__ (use \`/help boydancer\` for more information) **`, ephemeral: true});
            cooldownUser(author, 10);
            return;
        } else if (audioUrl && audioFile) {
            let replies = [`Ha Ha very funny. "lem e putt url an fil as jok" :nerd::nerd::nerd:`, `No...`, `Kindly deactive yourself :blush:`, `Moderators, crush his skull`, `I'm gonna fuck your mother`, `2 Inputs, 2 Braincells`, `Go **Link** yourself some bitches and make them **Audio**`, `hey buddy. we're going to kill you and leave you laid out in a dumpster to rot`, `https://cdn.discordapp.com/attachments/873603423998705718/1145258850132443206/8apAlKE.gif`, `https://cdn.discordapp.com/attachments/873603423998705718/1145258963676430346/cqtykgb.gif`, `https://cdn.discordapp.com/attachments/873603423998705718/1145985376515788800/pjSHLOr.png`];
            let randomMessage = Math.floor(Math.random() * replies.length);
            interaction.reply(replies[randomMessage]);
            cooldownUser(author, 60);
            return;
        } else if (audioUrl && !audioFile) {
            const link = audioUrl.toLowerCase();
            if (!link.startsWith("https://")) {
                interaction.reply({content: `${emojiError} - ** Please provide a correct link (supported are __Youtube__, __SoundCloud__ and __Audio/Video__ links (use \`/help boydancer\` for more information) **`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            } else if (isYoutubeLink(audioUrl)) {
                if (isWorkingLink(audioUrl)) {
                    const videoLive = await checkLiveStatus(audioUrl);
                    if (videoLive) {
                        interaction.reply({content: `:blush: ** **- ** Please ensure the __Youtube Video__ is not a __Livestream__ **`, ephemeral: true}); //kys
                        cooldownUser(author, 10);
                        return;
                    } else {
                        const length = await checkYoutubeVideoLength(audioUrl);
                        if (length > 600) {
                            interaction.reply({content: `${emojiError} - ** Please ensure that the __YouTube Video__ is __10 minutes (600 seconds)__ or shorter **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else { //fun part
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
                                } else if (start + 60 < end) {
                                    interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`, ephemeral: true});
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
                                } else if (end <= 60) {
                                    danceEnd = end;
                                } else if (end > 60) {
                                    danceStart = end - 60;
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
                            		danceEnd = start + 60;
                        		} else if (start + 60 > length) {
                                    danceStart = start;
                                    danceEnd = length;
                                } else if (start) {
                                    danceStart = start;
                                    danceEnd = start + 60;
                                } else {
                                    interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ time **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                }
                            }
                            interaction.reply({content: `Generating video... <a:boypet2:1146012115451265035>`});
                            await downloadYoutubeVideo(audioUrl);
                            cooldownUser(author, 2);
                            try {
                                await applyAudioWithDelay(tempYoutubePath, danceStart, length < 60 ? length : danceEnd, 5000);
                                await interaction.editReply({content: `${emojiSuccess} - Here is your boydancer ${interaction.user}:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                                fs.unlinkSync(outputVideoPath);
                                fs.unlinkSync(tempYoutubePath);
                                cooldownUser(author, 60);
                            } catch (error) {
                                console.error('Error generating the video:', error);
                                interaction.followUp('An error occurred while generating the video.');
                                cooldownUser(author, 10);
                                fs.unlinkSync(tempYoutubePath);
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
                        if (length > 600) {
                            interaction.reply({content: `${emojiError} - ** Please ensure that the __SoundCloud Song__ is __10 minutes (600 seconds)__ or shorter **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        } else { //fun part
                            if (startTime && endTime) {
                                const start = giveSecondsFromTime(startTime);
                                const end = giveSecondsFromTime(endTime);
                                if (start > length || end > length) {
                                    interaction.reply({content: `${emojiError} - ** Please ensure your __START__ and/or __END__ times are shorter than the song's duration **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (start >= end) {
                                    interaction.reply({content: `${emojiError} - ** Please ensure your __START__ time is shorter than __END__ time **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                } else if (start + 60 < end) {
                                    interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`, ephemeral: true});
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
                                } else if (end <= 60) {
                                    danceEnd = end;
                                } else if (end > 60) {
                                    danceStart = end - 60;
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
                            		danceEnd = start + 60;
                        		} else if (start + 60 > length) {
                                    danceStart = start;
                                    danceEnd = length;
                                } else if (start) {
                                    danceStart = start;
                                    danceEnd = start + 60;
                                } else {
                                    interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ time **`, ephemeral: true});
                                    cooldownUser(author, 10);
                                    return;
                                }
                            }
                            interaction.reply({content: `Generating video... <a:boypet2:1146012115451265035>`});
                            await downloadSoundCloud(audioUrl);
                            cooldownUser(author, 2);
                            try {
                                await applyAudioWithDelay(tempYoutubePath, danceStart, length < 60 ? length : danceEnd, 5000);
                                await interaction.editReply({content: `${emojiSuccess} - Here is your boydancer ${interaction.user}:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                                fs.unlinkSync(outputVideoPath);
                                fs.unlinkSync(tempYoutubePath);
                                cooldownUser(author, 60);
                            } catch (error) {
                                console.error('Error generating the video:', error);
                                interaction.followUp('An error occurred while generating the video.');
                                cooldownUser(author, 10);
                                fs.unlinkSync(tempYoutubePath);
                            }
                        }
                } else {
                    interaction.reply({content: `${emojiError} - ** The __SoundCloud Link__ you provided Does Not Exist **`, ephemeral: true});
                    cooldownUser(author, 10);
                    return;
                }
            } else if (correctFile.some(extension => link.endsWith(extension))) {
                const length = await getVideoDuration(audioUrl);
                if (length) {
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
                        } else if (start + 60 < end) {
                            interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`, ephemeral: true});
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
                        } else if (end <= 60) {
                            danceEnd = end;
                        } else if (end > 60) {
                            danceStart = end - 60;
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
                            danceEnd = start + 60;
                        } else if (start + 60 > length) {
                            danceStart = start;
                            danceEnd = length;
                        } else if (start) {
                            danceStart = start;
                            danceEnd = start + 60;
                        } else {
                            interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ time **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        }
                    }
                    interaction.reply({content: `Generating video... <a:boypet2:1146012115451265035>`});
                    cooldownUser(author, 1);
                    try {
                        await applyAudioToVideoFILE(audioUrl, danceStart, length < 60 ? length : danceEnd);
                        await interaction.editReply({content: `${emojiSuccess} - Here is your boydancer ${interaction.user}:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                        fs.unlinkSync(outputVideoPath);
                        cooldownUser(author, 60);
                    } catch (error) {
                        console.error('Error generating the video:', error);
                        interaction.followUp('An error occurred while generating the video.');
                        cooldownUser(author, 10);
                    }
                } else {
                    interaction.reply('An error occurred while getting file data.');
                    interaction.followUp({content: 'if you did everything correctly and think it\'s a bug, make a report `/report bug`', ephemeral: true});
                    cooldownUser(author, 10);
                }
            } else {
                interaction.reply({content: `${emojiError} - ** Please provide a supported link (supported are __Youtube__, __SoundCloud__ and __Audio/Video__ links (use \`/help boydancer\` for more information) **`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            }
        } else if (audioFile && !audioUrl) {
            const file = audioFile.url;
            if (!correctFile.some(extension => file.endsWith(extension))) {
                interaction.reply({content: `${emojiError} - Please use a correct File (use \`/help boydancer\` for more information)`, ephemeral: true});
                cooldownUser(author, 10);
                return;
            } else {
                const length = await getVideoDuration(file);
                if (length) {
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
                        } else if (start + 60 < end) {
                            interaction.reply({content: `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`, ephemeral: true});
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
                        } else if (end <= 60) {
                            danceEnd = end;
                        } else if (end > 60) {
                            danceStart = end - 60;
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
                            danceEnd = start + 60;
                        } else if (start + 60 > length) {
                            danceStart = start;
                            danceEnd = length;
                        } else if (start) {
                            danceStart = start;
                            danceEnd = start + 60;
                        } else {
                            interaction.reply({content: `${emojiError} - ** Please insert a correct __START__ time **`, ephemeral: true});
                            cooldownUser(author, 10);
                            return;
                        }
                    }
                    interaction.reply({content: `Generating video... <a:boypet2:1146012115451265035>`});
                    cooldownUser(author, 1);
                    try {
                        await applyAudioToVideoFILE(file, danceStart, length < 60 ? length : danceEnd);
                        await interaction.editReply({content: `${emojiSuccess} - Here is your boydancer:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                        fs.unlinkSync(outputVideoPath);
                        cooldownUser(author, 60);
                    } catch (error) {
                        console.error('Error generating the video:', error);
                        interaction.followUp('An error occurred while generating the video.');
                        cooldownUser(author, 10);
                    }
                } else {
                    interaction.reply('An error occurred while getting file data.');
                    interaction.followUp({content: 'if you did everything correctly and think it\'s a bug, make a report `/report bug`', ephemeral: true});
                    cooldownUser(author, 10);
                }
            }
        }

        //functions

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

        //audio applying function

        async function applyAudioToVideoFILE(file, start, end) {
            const duration = end - start;
            return new Promise((resolve, reject) => {
                const ffmpegProcess = ffmpeg()
                    .input(`./files/permanentFiles/theboydancer.mp4`)
                    .inputOptions(['-ss 0'])
                    .input(file)
                    .inputOptions(['-ss ' + start.toString()])
                    .complexFilter([
                        '[0:a]volume=0.2[audio];[1:a]volume=1[music];[audio][music]amix=inputs=2:duration=first:dropout_transition=2[audioout]'
                    ])
                    .outputOptions(['-map 0:v', '-map [audioout]', '-c:v copy', '-c:a aac', '-t ' + duration.toString(), '-y'])
                    .output(outputVideoPath)
                    .on('error', (err) => {
                        reject(err);
                    })
                    .on('end', () => {
                        resolve(outputVideoPath);
                    });
        
                ffmpegProcess.run();
            });
        }

        async function applyAudioWithDelay(file, start, end, delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
            await applyAudioToVideoFILE(file, start, end);
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

        function isWorkingLink(videoUrl) {
            return ytdl.validateURL(videoUrl);
        }

        async function checkLiveStatus(videoUrl) {
            try {
                const info = await ytdl.getInfo(videoUrl);
                const isLive = info.videoDetails.isLiveContent;
                return isLive;
            } catch (error) {
                console.error(error);
                interaction.reply(`${client.config.emoji.error} - There was an **ERROR** getting **Youtube Video** info`);
                return;
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

        // SoundCloud Functions

        function isSoundCloudLink(Url) {
            const patterns = [
                /^https?:\/\/(soundcloud\.com)\/(.*)$/,
              ];
          
            for (const pattern of patterns) {
                if (pattern.test(Url)) {
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

        //links function

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
   },
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
