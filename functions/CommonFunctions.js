/* eslint-disable no-async-promise-executor */
const fs = require('fs');
const util = require('util');
const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
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

async function applyAudioToVideoFILE(interaction, file, start, end, danceEnd) {

    // Speed
    const selectedSpeed = interaction.options.getInteger("speed");
    const beatsPerMin = interaction.options.getInteger("bpm");
    const audioSpeed = selectedSpeed || 100;
    const normalizedAudioSpeed = Math.min(200, Math.max(50, audioSpeed));

    // Volume
    const audioVolume = interaction.options.getInteger("volume");
    const volume = !audioVolume ? 100 : audioVolume > 500 ? 500 : audioVolume < 10 ? 10 : audioVolume;

    // Duration
    const calculatedDuration = (end - start) / (normalizedAudioSpeed / 100);
    const duration = calculatedDuration <= danceEnd ? calculatedDuration : danceEnd;

    // Viber
    const viber = interaction.options.getInteger("viber");
    const backgroundViber = `./files/permanentFiles/back${viber}.mp4`;
    const [videoFps, width, height, bitrate] = await getVideoDetails(backgroundViber);

    // Paths
    const outputVideoPath = `./files/temporaryFinalVideo/${interaction.user.id}.mp4`;

    // BPM
    const bpm = !beatsPerMin ? getViberBPM(viber) : beatsPerMin > 1000 ? 1000 : beatsPerMin < 10 ? 10 : beatsPerMin;
    const beat = getViberBPM(viber);
    const fps = videoFps / (beat / bpm);

    // Filter
    const modifier = interaction.options.getInteger("modifiers");

    // Size

    let maxMB = getMaxMB(interaction.guild.premiumTier);
    const calculateResizePercentage = Math.sqrt(maxMB / (((bitrate / 40) * duration * fps) / (8 * 1024 * 1024)));
    const finalWidth = Math.floor((width * calculateResizePercentage) / 2) * 2;
    const finalHeight = Math.floor((height * calculateResizePercentage) / 2) * 2;

    // Filter modification
    
    let modifiers = {
        cfilter: `[1:a]atempo=${normalizedAudioSpeed / 100},volume=${volume / 100}[music];[music]amix=inputs=1[audioout]`,
        vbit: 0,
        abit: 0,
        vfilter: `setpts=${beat / bpm}*PTS,scale=${finalWidth > width ? width : finalWidth}:${finalHeight > height ? height : finalHeight}`,
    };

    if (modifier) {
        await chooseFilter(modifier, modifiers, normalizedAudioSpeed, volume, beat, bpm);
    };

    return new Promise((resolve, reject) => {
        const ffmpegProcess = ffmpeg()
        .input(backgroundViber)
        .inputOptions(['-ss 0', '-stream_loop -1'])
        .input(file)
        .inputOptions(['-ss ' + start.toString()])
        .complexFilter(modifiers.cfilter)
        .videoBitrate(modifiers.vbit)
        .audioBitrate(modifiers.abit)
        .fps(fps)
        .outputOptions([
            '-map 0:v',
            '-map [audioout]',
            '-c:v libx264',
            '-c:a aac',
            '-t ' + duration.toString(),
            '-y',
        ])
        .output(outputVideoPath)
        .videoFilter(modifiers.vfilter)
            .on('error', (err) => {
                reject(err);
            })
            .on('end', () => {
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

// Filters/Modifiers

async function chooseFilter(filter, modifier, normalizedAudioSpeed, volume, beat, bpm) {

    switch (filter) {

        case config.Filters.troll:
            modifier.cfilter = `[1:a]atempo=${normalizedAudioSpeed / 100},volume=${volume / 67}[music];[music]amix=inputs=1[audioout]`;
            modifier.abit = "1k";
            modifier.vbit = "10k";
            modifier.vfilter = `setpts=${beat / bpm}`;

        case config.Filters.mb25: //25mb
       ;

        case config.Filters.bathroom: //reverb (bathroom)
            modifier.cfilter = `[1:a]atempo=${normalizedAudioSpeed / 100},volume=${volume / 100},aecho=0.8:1:10:1[reverb];[reverb]amix=inputs=1[audioout]`;

        case config.Filters.emptyRoom: //reverb (empty room)
            modifier.cfilter = `[1:a]atempo=${normalizedAudioSpeed / 100},volume=${volume / 100},aecho=0.6:1:400:0.8[reverb];[reverb]amix=inputs=1[audioout]`;

        case config.Filters.underwater:
            modifier.cfilter = `[1:a]atempo=${normalizedAudioSpeed / 100},volume=${volume / 100},aformat=sample_fmts=s16:channel_layouts=stereo,lowpass=300[underwater];[underwater]amix=inputs=1[audioout]`;

        case config.Filters.twotwo: //2x2
            modifier.abit = "1k";
            modifier.vbit = "1k";
            modifier.vfilter = `setpts=10*PTS,scale=2:2`;

    } return modifier;
};

// Get FPS and Resolution from the video

async function getVideoDetails(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, { path: ffprobe.path }, (err, metadata) => {
      if (err) {
        console.log("esrr")
        reject(err);
        return;
    } else {
      const data = metadata.streams[0];
      const fps = data.avg_frame_rate.split('/')[0];
      const width = data.width;
      const height = data.height;
      const bitrate = data.bit_rate;
      resolve([fps, width, height, bitrate]);
    }
    });
  });
};

module.exports = { cooldownUser, giveSecondsFromTime, applyAudioWithDelay, getVideoDuration, getFinalFileName };
