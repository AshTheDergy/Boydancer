const fs = require('fs');
const { spawn } = require('child_process').spawn;
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { CommandInteraction } = require("discord.js");
const PH = require("../../handlers/Client");
const cooldowns = new Map();
const humanizeDuration = require('humanize-duration');

module.exports = {
    name: "boydancer",
    description: `Apply audio (currently only audio files) to boykisser dancing video max 60 seconds!! (in beta)`,
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
            description: "A video/song link (currently youtube and file links only)",
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

        const correctFile = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"]
        const correctYoutube = "https://www.youtu";
        const correctShareYoutube = "https://youtu.be"

        const audioFile = interaction.options.getAttachment('file');
        const audioUrl = interaction.options.getString("link");
        const startTime = interaction.options.getString("start");
        const endTime = interaction.options.getString("end");

        var danceStart = 0
        var danceEnd = 60

        const randomFileName = interaction.user.id;
        const ffmpegPath = `./Commands/Boydancer/ffmpeg.exe`
        const boyDancerFile = `./files/permanentFiles/theboydancer.mp4`;
        const outputVideoPath = `./files/temporaryFinalVideo/${randomFileName}.mp4`;
        const tempYoutubePath = `./files/temporaryYoutube/${randomFileName}.wav`;

    if (cooldown) {
        const remaining = humanizeDuration(cooldown - Date.now(), { units: ['m', 's'], round: true });
        client.embed(
            interaction,
            `You are On Cooldown, wait \`${remaining}\``
        );
    } else if (!audioUrl && !audioFile) {
        client.embed(
            interaction,
            `${emojiError} - ** Please provide a __Link__ or __File__ (use \`/help boydancer\` for more information) **`
        )
        cooldownUser(author, 10);
        return;
    } else if (audioUrl && !audioFile) {
        var audioTestUrl = audioUrl
        if (audioUrl.startsWith("https://you")) {
            audioTestUrl.replace("https://", "https://www.");
        };
        const a = audioTestUrl.toLowerCase()
        if (!a.startsWith("https://")) {
            client.embed(
                interaction,
                `${emojiError} - ** Please provide a correct link (supported only __Youtube__ and __Audio__ links (use \`/help boydancer\` for more information)**`
            );
            cooldownUser(author, 10);
            return;
        } else if (!correctFile.some(extension => a.endsWith(extension)) && !a.startsWith(correctYoutube) && !a.startsWith(correctShareYoutube)) {
            client.embed(
                interaction,
                `${emojiError} - ** Please provide a supported file link (use \`/help boydancer\` for more information) **`
            );
            cooldownUser(author, 10);
            return;
        } else if (a.startsWith(correctYoutube) || a.startsWith(correctShareYoutube)) {
            /*const videoId = await extractVideoId(audioUrl);
            if (!videoId) {
                client.embed(
                    interaction,
                    `${emojiError} - ** The video you are trying to access __DOES NOT EXIST__ or is __PRIVATED__**`
                );
                cooldownUser(author, 10);
                return;
            }*/
            const videoLive = await checkLiveStatus(audioUrl);
            if (videoLive) {
                client.embed(
                    interaction,
                    `:blush: ** **- ** Please make sure the __Youtube Video__ is not a __Livestream__ **` //kys
                );
                cooldownUser(author, 10);
                return;
            } else {
                const length = await checkYoutubeVideoLength(audioUrl);
                if (length > 600) {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please ensure that the __YouTube Video__ is __10 minutes (600 seconds)__ or shorter **`
                    );
                } else {
                    await downloadYoutubeVideo(audioUrl);
                        if (startTime && endTime) {
                            const start1 = giveSecondsFromTime(startTime);
                            const end1 = giveSecondsFromTime(endTime);
                            if (start1 > length || end1 > length) {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please make sure your __START__ and/or __END__ time is smaller than the video **`
                                )
                                cooldownUser(author, 10);
                                return;
                            } else if (end1 <= start1) {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please make sure your __START__ time is smaller than __END__ time **`
                                );
                                cooldownUser(author, 10);
                                return;
                            } else if (start1 + 60 < end1) {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`
                                );
                                cooldownUser(author, 10);
                                return;
                            } else if (start1 && end1) {
                                danceStart = start1;
                                danceEnd = end1;
                            } else {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please insert a correct __START__ and/or __END__ time **`
                                );
                                cooldownUser(author, 10);
                                return;
                            };
                        } else if (!startTime && endTime) {
                            const end1 = giveSecondsFromTime(endTime);
                            if (end1 > length) {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please make sure your __END__ time is smaller than the video **`
                                )
                                cooldownUser(author, 10);
                                return;
                            } else if (end1 <= 60) {
                                danceEnd = end1;
                            } else if (end1 > 60) {
                                danceStart = end1 - 60;
                                danceEnd = end1;
                            } else {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please insert a correct __END__ time **`
                                );
                                cooldownUser(author, 10);
                                return;
                            };
                        } else if (startTime && !endTime) {
                            const start1 = giveSecondsFromTime(startTime);
                            if (start1 > length) {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please make sure your __START__ time is smaller than the video **`
                                )
                                cooldownUser(author, 10);
                                return;
                            } else if (start1 + 60 > length) {
                                danceStart = start1;
                                danceEnd = length;
                            } else if (start1) {
                                danceStart = start1;
                                danceEnd = start1 + 60;
                            } else {
                                client.embed(
                                    interaction,
                                    `${emojiError} - ** Please insert a correct __START__ time **`
                                );
                                cooldownUser(author, 10);
                                return;
                            };
                        }
                        cooldownUser(author, 2)
                            try {
                                await applyAudioWithDelay(tempYoutubePath, danceStart, length < 60 ? length : danceEnd, 5000);
                                await interaction.followUp({content: `${emojiSuccess} - Here is your boydancer:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                                fs.unlinkSync(outputVideoPath);
                                fs.unlinkSync(tempYoutubePath);
                                cooldownUser(author, 60);
                                await client.usage.set(`${interaction.user.id}.successful`, usedSuccessful ? parseInt(usedSuccessful) + 1 : 1);
                            } catch (error) {
                                console.error('Error generating the video:', error);
                                interaction.followUp('An error occurred while generating the video.');
                            }
                }
            }
        } else {
            const length = await getVideoDuration(audioUrl);
            if (length) {
                if (startTime && endTime) {
                    const start1 = giveSecondsFromTime(startTime);
                    const end1 = giveSecondsFromTime(endTime);
                    if (start1 > length || end1 > length) {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please make sure your __START__ and/or __END__ time is smaller than the file **`
                        )
                        cooldownUser(author, 10);
                        return;
                    } else if (end1 <= start1) {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please make sure your __START__ time is smaller than __END__ time **`
                        );
                        cooldownUser(author, 10);
                        return;
                    } else if (start1 + 60 < end1) {
                        client.embed(
                            interaction,
                            `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`
                        );
                        cooldownUser(author, 10);
                        return;
                    } else if (start1 && end1) {
                        danceStart = start1;
                        danceEnd = end1;
                    } else {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please insert a correct __START__ and/or __END__ time **`
                        );
                        cooldownUser(author, 10);
                        return;
                    };
                } else if (!startTime && endTime) {
                    const end1 = giveSecondsFromTime(endTime);
                    if (end1 > length) {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please make sure your __END__ time is smaller than the file **`
                        )
                        cooldownUser(author, 10);
                        return;
                    } else if (end1 <= 60) {
                        danceEnd = end1;
                    } else if (end1 > 60) {
                        danceStart = end1 - 60;
                        danceEnd = end1;
                    } else {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please insert a correct __END__ time **`
                        );
                        cooldownUser(author, 10);
                        return;
                    };
                } else if (startTime && !endTime) {
                    const start1 = giveSecondsFromTime(startTime);
                    if (start1 > length) {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please make sure your __START__ time is smaller than the file **`
                        )
                        cooldownUser(author, 10);
                        return;
                    } else if (start1 + 60 > length) {
                        danceStart = start1;
                        danceEnd = length;
                    } else if (start1) {
                        danceStart = start1;
                        danceEnd = start1 + 60;
                    } else {
                        client.embed(
                            interaction,
                            `${emojiError} - ** Please insert a correct __START__ time **`
                        );
                        cooldownUser(author, 10);
                        return;
                    };
                };
                cooldownUser(author, 1);
                try {
                    await applyAudioToVideoFILE(audioUrl, danceStart, length < 60 ? length : danceEnd);
                    await interaction.followUp({content: `${emojiSuccess} - Here is your boydancer:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                    fs.unlinkSync(outputVideoPath);
                    cooldownUser(author, 60);
                    await client.usage.set(`${interaction.user.id}.successful`, usedSuccessful ? parseInt(usedSuccessful) + 1 : 1);
                } catch (error) {
                    console.error('Error generating the video:', error);
                    interaction.followUp('An error occurred while generating the video.');
                }
            } else {
                interaction.followUp('An error occurred while getting file data.');
                interaction.followUp('if you did everything correctly and think it\'s a bug, make a report \`/report bug\`', {ephemeral: true});
                cooldownUser(author, 10);
            }
        }
    } else if (audioFile && !audioUrl) {
      const af = audioFile.url;
        if (!correctFile.some(extension => af.endsWith(extension))) {
        client.embed(
            interaction,
            `${emojiError} - Please use a correct File (use \`/help boydancer\` for more information)`
        );
        cooldownUser(author, 10);
        return;
      } else {
        const length = await getVideoDuration(af);
        if (length) {
            if (startTime && endTime) {
                const start1 = giveSecondsFromTime(startTime);
                const end1 = giveSecondsFromTime(endTime);
                if (start1 > length || end1 > length) {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please make sure your __START__ and/or __END__ time is smaller than the file **`
                    )
                    cooldownUser(author, 10);
                    return;
                } else if (end1 <= start1) {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please make sure your __START__ time is smaller than __END__ time **`
                    );
                    cooldownUser(author, 10);
                    return;
                } else if (start1 + 60 < end1) {
                    client.embed(
                        interaction,
                        `${emojiError} - ** The time between __START__ and __END__ is over \`60\` seconds **`
                    );
                    cooldownUser(author, 10);
                    return;
                } else if (start1 && end1) {
                    danceStart = start1;
                    danceEnd = end1;
                } else {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please insert a correct __START__ and/or __END__ time **`
                    );
                    cooldownUser(author, 10);
                    return;
                };
            } else if (!startTime && endTime) {
                const end1 = giveSecondsFromTime(endTime);
                if (end1 > length) {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please make sure your __END__ time is smaller than the file **`
                    )
                    cooldownUser(author, 10);
                    return;
                } else if (end1 <= 60) {
                    danceEnd = end1;
                } else if (end1 > 60) {
                    danceStart = end1 - 60;
                    danceEnd = end1;
                } else {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please insert a correct __END__ time **`
                    );
                    cooldownUser(author, 10);
                    return;
                };
            } else if (startTime && !endTime) {
                const start1 = giveSecondsFromTime(startTime);
                if (start1 > length) {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please make sure your __START__ time is smaller than the file **`
                    )
                    cooldownUser(author, 10);
                    return;
                } else if (start1 + 60 > length) {
                    danceStart = start1;
                    danceEnd = length;
                } else if (start1) {
                    danceStart = start1;
                    danceEnd = start1 + 60;
                } else {
                    client.embed(
                        interaction,
                        `${emojiError} - ** Please insert a correct __START__ time **`
                    );
                    cooldownUser(author, 10);
                    return;
                };
            };
            cooldownUser(author, 1);
                try {
                    await applyAudioToVideoFILE(af, danceStart, length < 60 ? length : danceEnd);
                    await interaction.followUp({content: `${emojiSuccess} - Here is your boydancer:`, files: [{ attachment: outputVideoPath, name: "Boydancer.mp4"}]});
                    fs.unlinkSync(outputVideoPath);
                    cooldownUser(author, 60);
                    await client.usage.set(`${interaction.user.id}.successful`, usedSuccessful ? parseInt(usedSuccessful) + 1 : 1);
                } catch (error) {
                    console.error('Error generating the video:', error);
                    interaction.followUp('An error occurred while generating the video.');
                }
        } else {
            interaction.followUp('An error occurred while getting file data.');
            cooldownUser(author, 10);
        }
      }
    } else {
        let replies = [`Ha Ha very funny. "lem e putt url an fil as jok :nerd::nerd::nerd:`, `No...`, `Kindly deactive yourself :blush:`, `<:oppy:1144574623736922283>`, `Moderators, crush his skull`, `I'm gonna fuck your mother`, `2 Inputs, 2 Braincells`, `Go **Link** yourself some bitches and make them **Audio**`, `hey buddy. we're going to kill you and leave you laid out in a dumpster to rot`, `https://cdn.discordapp.com/attachments/873603423998705718/1145258850132443206/8apAlKE.gif`, `https://cdn.discordapp.com/attachments/873603423998705718/1145258963676430346/cqtykgb.gif`];
        let randomMessage = Math.floor(Math.random() * replies.length);
        interaction.followUp(replies[randomMessage]);
        cooldownUser(author, 60);
        return;
    }

    //functions

    function cooldownUser(user, time) {
        cooldowns.set(user, Date.now() + time * 1000); //time in seconds
        setTimeout(() => cooldowns.delete(interaction.user.id), time * 1000);
    };

    async function applyAudioWithDelay(file, start, end, delay) {
        await new Promise(resolve => setTimeout(resolve, delay));
        await applyAudioToVideoFILE(file, start, end);
    };

    async function extractVideoId(videoUrl) {
        const match = videoUrl.match(/[?&]v=([a-zA-Z0-9-_]{11})/);
        return match ? match[1] : null;
    };

    async function checkLiveStatus(videoUrl) {
        try {
            const info = await ytdl.getInfo(videoUrl);
            const isLive = info.videoDetails.isLiveContent;
            return isLive;
        } catch (error) {
            console.error(error);
            interaction.followUp(`${client.config.emoji.error} - There was an **ERROR** getting **Youtube Video** info`);
            return;
        }
    };

    async function checkYoutubeVideoLength(videoUrl) {
        try {
            const info = await ytdl.getBasicInfo(videoUrl);
            const length = info.videoDetails.lengthSeconds;
            return length;
        } catch (error) {
            console.error(error);
            interaction.followUp(`${client.config.emoji.error} - There was an **ERROR** getting **Youtube Video** info`);
            return true;
        };
    };

    async function downloadYoutubeVideo(videoUrl) {
        const options = {quality: 'highestaudio'};
        const stream = ytdl(videoUrl, options);
        const outputPath = tempYoutubePath;
        const fileStream = fs.createWriteStream(outputPath);
        stream.pipe(fileStream);
        stream.on('error', (err) => {
        console.error('Error:', err);
        });
    };

    function giveSecondsFromTime(input) {
        const timePattern = /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        const [minutes, seconds] = input.split(":").map(Number);
        if (!timePattern.test(input)) {
            return false;
        } else if (minutes < 0 || minutes > 9 && seconds > 0 || minutes > 10 || seconds < 0 || seconds > 60) {
            return false;
        } else {
            return seconds + minutes * 60;
        };
    };

    async function applyAudioToVideoFILE(file, start, end) {
    const duration = end - start;
    return new Promise((resolve, reject) => {
        const ffmpegProcess = ffmpeg()
            .input(`./files/permanentFiles/theboydancer.mp4`)
            .inputOptions(['-ss 0', '-ss ' + start.toString()])
            .input(file)
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
