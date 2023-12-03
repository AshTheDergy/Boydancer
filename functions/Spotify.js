const fs = require('fs');
const util = require('util');
const { giveSecondsFromTime, cooldownUser, applyAudioWithDelay, getFinalFileName, getVideoDuration } = require("./CommonFunctions");
const config = require("../settings/config");
const { PythonShell } = require('python-shell');
const path = require('path');

// Spotify functions
function getSpotifyLink(url) {
    const patterns = [
        /(https?:\/\/open.spotify.com\/(track)\/[a-zA-Z0-9]+)/,
        /(https?:\/\/open.spotify.com\/(intl-[a-z]{2})\/(track)\/[a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern)?.[0];
        
        if (!match) {
            continue;
        }

        return match;
    }
    
    return null;
}

async function downloadSpotify(interaction, audioUrl) {
    // Files
    const author = interaction.user.id;
    const SpotifyTemp = `./files/spotify_temp_files/`;
    const SpotifyPath = `./files/temporarySpotify/`;
    const outputPath = SpotifyPath;

    try {
        await PythonShell.run(path.join(__dirname, '../scripts/spotify.py'), {
            args: [
                outputPath,
                SpotifyTemp,
                config.Spotify.cookies,
                config.Spotify.widevine_device,
                config.Spotify.ffmpeg,
                author,
                audioUrl
            ]
        });
        return true;
    } catch (reason) {
        if (!interaction.replied) {
            console.log(reason.traceback)
            interaction.editReply(util.format(config.strings.error.video_generation_detailed, reason.message));
        }
    }
    return false;
}

async function handleSpotify(client, interaction, audioUrl, cooldowns) {
    // Defer Reply
   await interaction.deferReply();

    // User
    const author = interaction.user.id;

    // Timing
    let danceStart = 0;
    let danceEnd = config.whitelisted.includes(author) ? config.danceEnd_Premium : config.danceEnd_Normal;
    const maxInput = config.whitelisted.includes(author) ? config.maxInput_Premium : config.maxInput_Normal;
    const startTime = interaction.options.getString("start");
    const endTime = interaction.options.getString("end");
    const beatsPerMin = interaction.options.getInteger("bpm");

    // Files
    const viber = interaction.options.getInteger("viber");
    const outputVideoPath = `./files/temporaryFinalVideo/${author}.mp4`;
    const tempSpotifyPath = `./files/temporarySpotify/${author}.m4a`;

    // Strings
    const finalFileName = getFinalFileName(viber);
    const finalMessage = `${interaction.user}${beatsPerMin > 225 && viber == 1 ? config.strings.epilepsy : '\n'}${config.strings.finished}`;

    // Usage / Leaderboard
    let used = await client.usage.get(`${interaction.guildId}.${author}`);
    const usedSuccessful = used?.successful;

    // Download
    
    if (!await downloadSpotify(interaction, audioUrl)) {
        return;
    }

    const length = await getVideoDuration(interaction, tempSpotifyPath);
    if (length > maxInput) {
        interaction.editReply({ content: util.format(config.strings.error.spotify_song_too_big, config.emoji.error) });
        cooldownUser(cooldowns, interaction, 10);
    } else {
        if (startTime && endTime) {
            const start = giveSecondsFromTime(author, startTime);
            const end = giveSecondsFromTime(author, endTime);
            if (start > length || end > length) {
                interaction.editReply({ content: util.format(config.strings.error.time_too_big, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (start >= end) {
                interaction.editReply({ content: util.format(config.strings.error.starttime_too_big, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (start + danceEnd < end) {
                interaction.editReply({ content: util.format(config.strings.error.time_over_danceEnd_limit, config.emoji.error, danceEnd) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (start === end) {
                interaction.editReply({ content: util.format(config.strings.error.time_is_the_same, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (start === 0 && end) {
                danceEnd = end;
            } else if (start && end) {
                danceStart = start;
                danceEnd = end;
            } else {
                interaction.editReply({ content: util.format(config.strings.error.time_incorrect, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            }
        } else if (!startTime && endTime) {
            const end = giveSecondsFromTime(author, endTime);
            if (end > length) {
                interaction.editReply({ content: util.format(config.strings.error.endtime_too_big, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (end === 0) {
                interaction.editReply({ content: util.format(config.strings.error.endtime_is_0, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            } else if (end <= danceEnd) {
                danceEnd = end;
            } else if (end > danceEnd) {
                danceStart = end - danceEnd;
                danceEnd = end;
            } else {
                interaction.editReply({ content: util.format(config.strings.error.endtime_incorrect, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            }
        } else if (startTime && !endTime) {
            const start = giveSecondsFromTime(author, startTime);
            if (start > length) {
                interaction.editReply({ content: util.format(config.strings.error.starttime_bigger_than_video, config.emoji.error) });
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
                interaction.editReply({ content: util.format(config.strings.error.starttime_incorrect, config.emoji.error) });
                cooldownUser(cooldowns, interaction, 10);
                return;
            }
        }

        let replies = config.strings.generation_replies;
        let randomMessage = Math.floor(Math.random() * replies.length);
        await interaction.editReply(replies[randomMessage]);
        cooldownUser(cooldowns, interaction, 5);

        // Tell the DB that the current User has started an Interaction
        await client.interaction_db.set(author);

        try {
            await applyAudioWithDelay(interaction, tempSpotifyPath, danceStart, length < danceEnd ? length : danceEnd, 5000, danceEnd);
            await interaction.editReply({ content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4` }] });
            fs.unlinkSync(outputVideoPath);
            fs.unlinkSync(tempSpotifyPath);
            cooldownUser(cooldowns, interaction, 60);
            await client.usage.set(`${interaction.guildId}.${author}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);

            // Tell the DB that the current User has finished their Interaction
            await client.interaction_db.delete(author);
        } catch (error) {
            // Tell the DB that the current User has finished their Interaction
            await client.interaction_db.delete(author);
            console.error(config.strings.error.video_generation, error);
            interaction.followUp(config.strings.error.video_generation);
            client.users.cache.get(config.error_dm).send(util.format(config.strings.error.video_generation_detailed_dm, interaction.guildId, author, error));
            cooldownUser(cooldowns, interaction, 10);
            fs.unlinkSync(tempSpotifyPath);
        }
    }
}

module.exports = { handleSpotify, getSpotifyLink };
