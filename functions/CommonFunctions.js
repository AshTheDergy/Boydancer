/* eslint-disable no-async-promise-executor */
const fs = require('fs');
const util = require('util');
const ffmpeg = require('fluent-ffmpeg');
const config = require("../settings/config");

async function getVideoDuration(interaction, videoUrl) {
    // Node.JS Error Handling suggested by Wroclaw. Yes this is garbage, but working garbage
    const callback = (reason) => {
        if (!interaction.replied) {
            interaction.editReply(config.strings.error.video_generation);
            client.users.cache.get(config.error_dm).send(util.format(config.strings.error.video_generation_detailed_dm, interaction.guildId, author, error));
        }
    };
    process.on('unhandledRejection', callback);

    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoUrl, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            if (metadata?.format?.duration) {
                const totalDurationInSeconds = parseFloat(metadata.format.duration);
                resolve(totalDurationInSeconds.toFixed(1));

                // Remove Error Handler after it isn't needed anymore
                process.removeListener('unhandledRejection', callback);
            } else {
                resolve(null);
            }
        });
    });
}

// Functions
function cooldownUser(cooldown_map, interaction, time) {
    cooldown_map.set(interaction.user.id, Date.now() + time * 1000); //time in seconds
    setTimeout(() => cooldown_map.delete(interaction.user.id), time * 1000);
}

function giveSecondsFromTime(author, input) {
    const maxMinute = config.whitelisted.includes(author) ? config.maxMinute_Premium : config.maxMinute_Normal;
    const timePattern = /^(0?\d|1\d|2[0-3]):[0-5]\d$/;
    const [minutes, seconds] = input.split(":").map(Number);
    if (!timePattern.test(input)) {
        return false;
    } else if (minutes < 0 || minutes > maxMinute && seconds > 0 || minutes > maxMinute || seconds < 0 || seconds > 60) {
        return false;
    } else {
        return seconds + minutes * 60;
    }
}

// Audio applying functions

async function changeVideoBPM(inputVideoPath, tempVid, beat, BPM, duration) {
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

async function applyAudioToVideoFILE(interaction, file, start, end, danceEnd) {

    // :troll:

    const troll = interaction.options.getBoolean("troll");

    // Speed
    const selectedSpeed = interaction.options.getInteger("speed");
    const beatsPerMin = interaction.options.getInteger("bpm");
    const audioSpeed = selectedSpeed || 100;
    const normalizedAudioSpeed = Math.min(200, Math.max(50, audioSpeed));

    // Volume

    const audioVolume = interaction.options.getInteger("volume");
    const volume = audioVolume > 500 ? 500 : audioVolume < 10 ? 10 : audioVolume || 1;

    // Duration
    const calculatedDuration = (end - start) / (normalizedAudioSpeed / 100);
    const duration = calculatedDuration <= danceEnd ? calculatedDuration : danceEnd;

    // Viber
    const viber = interaction.options.getInteger("viber");
    const backgroundViber = `./files/permanentFiles/back${viber}.mp4`;

    // Paths
    const tempVideoPath = `./files/otherTemp/${interaction.user.id}.mp4`;
    const outputVideoPath = `./files/temporaryFinalVideo/${interaction.user.id}.mp4`;

    // Size

    let maxMB = getMaxMB(interaction.guild.premiumTier);
    const reducerNum = Math.max(Math.round((maxMB / (duration - duration * 0.94)) * 10) / 10, 0.1);
    const reducer = troll ? 0.1 : reducerNum > 1 ? 1 : reducerNum

    // Apply BPM Change if specified
    if (beatsPerMin) {
        const bpm = getBeatsPerMin(beatsPerMin);
        let beat = getViberBPM(viber);

        await changeVideoBPM(backgroundViber, tempVideoPath, beat, bpm, duration);
    }
    
    return new Promise((resolve, reject) => {
        const ffmpegProcess = ffmpeg()
            .input(beatsPerMin ? tempVideoPath : backgroundViber)
            .inputOptions(['-ss 0', '-stream_loop -1'])
            .input(file)
            .inputOptions(['-ss ' + start.toString()])
            .complexFilter([
                `[1:a]atempo=${normalizedAudioSpeed / 100},volume=${volume / 100}[music];[music]amix=inputs=1[audioout]`,
            ])
            .outputOptions([
                '-map 0:v',
                '-map [audioout]',
                '-c:v libx264',
                '-c:a aac',
                '-t ' + duration.toString(),
                '-y',
            ])
            .output(outputVideoPath)
            .audioBitrate(troll ? 1 : 8000)
            .videoFilter(`scale=iw*${reducer > 1 ? 1 : reducer}:-1`)
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

async function applyAudioWithDelay(interaction, file, start, end, delay, danceEnd) {
    await new Promise(resolve => setTimeout(resolve, delay));
    await applyAudioToVideoFILE(interaction, file, start, end, danceEnd);
}

function getFinalFileName(viber) {
    switch (viber) {
        case config.ViberType.BoyDancer:
            return "Boydancer";
        case config.ViberType.BoyJammer:
            return "Boyviber";
        default:
            return "gaysex";
    }
}

function getViberBPM(viber) {
    switch (viber) {
        case config.ViberType.BoyDancer: //1
            return 155;
        case config.ViberType.BoyJammer: //2
            return 155;
        case config.ViberType.BoyOriginal: //4
            return 120;
        case config.ViberType.BoyYayDancer: //5
            return 155;
        case config.ViberType.BoySinger: //6
            return 99;
        case config.ViberType.BoyHappySing: //7
            return 149;
        default:
            return 100;
    }
}

function getMaxMB(guild) {
    if (guild == 2) return 50;
    if (guild == 3) return 100;
    return 25
}

function getBeatsPerMin(beatsPerMin) {
    // Old Code: return beatsPerMin ? beatsPerMin > 500 ? 500 : beatsPerMin < 50 ? 50 : beatsPerMin : 10000;

    if (!beatsPerMin) return 10000;
    if (beatsPerMin > 500) return 500;
    if (beatsPerMin < 50) return 50;
    return beatsPerMin;
}

module.exports = { cooldownUser, giveSecondsFromTime, applyAudioWithDelay, getVideoDuration, getFinalFileName };
