const fs = require('fs');
const util = require('util');
const ffmpeg = require('fluent-ffmpeg');
const config = require("../settings/config");

async function getVideoDuration(interaction, videoUrl) {
    // Node.JS Error Handling suggested by Wroclaw. Yes this is garbage, but working garbage
    const callback = (reason) => {
        if (!interaction.replied) {
            interaction.editReply(util.format(config.strings.error.video_generation_detailed, reason.message));
        }
    };
    process.on('unhandledRejection', callback);

    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoUrl, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            if (metadata && metadata.format && metadata.format.duration) {
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
    const timePattern = /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
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
    // Speed
    const selectedSpeed = interaction.options.getInteger("speed");
    const beatsPerMin = interaction.options.getInteger("bpm");
    const audioSpeed = selectedSpeed ? selectedSpeed : 100;
    const normalizedAudioSpeed = Math.min(200, Math.max(50, audioSpeed));

    // Duration
    const calculatedDuration = (end - start) / (normalizedAudioSpeed / 100);
    const duration = calculatedDuration <= danceEnd ? calculatedDuration : danceEnd;

    // Viber
    const viber = interaction.options.getInteger("viber");
    const backgroundViber = `./files/permanentFiles/back${viber}.mp4`;

    // Paths
    const tempVideoPath = `./files/otherTemp/${interaction.user.id}.mp4`;
    const outputVideoPath = `./files/temporaryFinalVideo/${interaction.user.id}.mp4`;

    return new Promise(async (resolve, reject) => {
        if (beatsPerMin) {
            const bpm = beatsPerMin ? beatsPerMin > 500 ? 500 : beatsPerMin < 50 ? 50 : beatsPerMin : 10000;
            const beat = viber == 1 ? 155 : 2 ? 155 : 100;
            await changeVideoBPM(backgroundViber, tempVideoPath, beat, bpm, duration);
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

async function applyAudioWithDelay(interaction, file, start, end, delay, danceEnd) {
    await new Promise(resolve => setTimeout(resolve, delay));
    await applyAudioToVideoFILE(interaction, file, start, end, danceEnd);
}

module.exports = { cooldownUser, giveSecondsFromTime, applyAudioWithDelay, getVideoDuration };