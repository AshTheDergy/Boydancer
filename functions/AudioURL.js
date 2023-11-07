const fs = require('fs');
const util = require('util');
const { giveSecondsFromTime, cooldownUser, applyAudioWithDelay, getVideoDuration, getFinalFileName } = require("./CommonFunctions");
const config = require("../settings/config");

async function handleURL(client, interaction, audioUrl, cooldowns) {
    // Defer Reply
    await interaction.deferReply();

    // User
    const author = interaction.user.id;

    // Timing
    var danceStart = 0;
    var danceEnd = config.whitelisted.includes(author) ? config.danceEnd_Premium : config.danceEnd_Normal;
    const startTime = interaction.options.getString("start");
    const endTime = interaction.options.getString("end");
    const beatsPerMin = interaction.options.getInteger("bpm");

    // Files
    const viber = interaction.options.getInteger("viber");
    const outputVideoPath = `./files/temporaryFinalVideo/${author}.mp4`;
    const tempVideoPath = `./files/otherTemp/${author}.mp4`;

    // Strings
    const finalFileName = getFinalFileName(viber);
    const finalMessage = `${interaction.user}${beatsPerMin > 225 && viber == 1 ? config.strings.epilepsy : '\n'}${config.strings.finished}`;

    // Usage / Leaderboard
    let used = await client.usage.get(`${interaction.guildId}.${author}`);
    const usedSuccessful = used?.successful;

    const length = await getVideoDuration(interaction, audioUrl);
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

    interaction.editReply({ content: config.strings.generation });
    cooldownUser(cooldowns, interaction, 5);

    // Tell the DB that the current User has started an Interaction
    await client.interaction_db.set(author);

    try {
        await applyAudioWithDelay(interaction, audioUrl, danceStart, length < danceEnd ? length : danceEnd, 5000, danceEnd);
        await interaction.editReply({ content: finalMessage, files: [{ attachment: outputVideoPath, name: `${finalFileName}.mp4` }] });
        fs.unlinkSync(outputVideoPath);
        cooldownUser(cooldowns, interaction, 60);
        await client.usage.set(`${interaction.guildId}.${author}.successful`, usedSuccessful ? usedSuccessful + 1 : 1);

        // Tell the DB that the current User has finished their Interaction
        await client.interaction_db.delete(author);
    } catch (error) {
        console.error(config.strings.error.video_generation, error);
        interaction.followUp(util.format(config.strings.error.video_generation_detailed, error));
        cooldownUser(cooldowns, interaction, 10);
        if (beatsPerMin) {
            fs.unlinkSync(tempVideoPath);
        }

        // Tell the DB that the current User has finished their Interaction
        await client.interaction_db.delete(author);
    }
}

module.exports = { handleURL };