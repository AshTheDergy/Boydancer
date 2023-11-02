require('dotenv').config();
module.exports = {
    news: {
        version: '2.0 Alpha 2',
        new: [
            '- Easier to maintain and fix',
            '- Spelling Fixes',
            '- More Customization of the Bot itself',
        ],
    },
    TOKEN: process.env.TOKEN,
    embed: {
        color: "#220f80",
        wrongcolor: "#8a0808",
        footertext: "Made by AshTheDergy | Fluffy Derg Productions, hosted by uwu_peter"
    },
    slash: {
        global: true,
        guildID: "1099007046902353972",
    },
    options: {
        embedFooter: true,
    },
    emoji: {
        error: "❌",
        success: "✅",
        ping: "🏓",
    },
    whitelisted: ['817843037593403402', '358936084278673415', '762219738570555412'],
    correctFile: [".mp3", ".wav", ".aac", ".flac", ".ogg", ".mp4", ".avi", ".mov", ".webm", ".3gp", ".mkv", ".qt"],
    danceEnd_Premium: 480,
    danceEnd_Normal: 120,
    maxInput_Premium: 1800,
    maxInput_Normal: 600,
    maxMinute_Premium: 30,
    maxMinute_Normal: 10,
    strings: {
        error: {
            invalid_everything: `%s - ** Please provide a __Link__ or __File__ (use \`/help boydancer\` for more information) **`,
            invalid_link: `%s - ** Please provide a supported link (supported are __Youtube__ __SoundCloud__ and __Audio/Video__ links (use \`/help boydancer\` for more information) **`,
            invalid_link_soundcloud: `%s - ** The __SoundCloud Link__ you provided Does Not Exist. __Shortened Links__ also don't work **`,
            time_too_big: `%s - ** Please ensure your __START__ and/or __END__ times are shorter than the video's duration **`,
            starttime_too_big: `%s - ** Please ensure your __START__ time is shorter than __END__ time **`,
            time_is_the_same: `%s - ** The time between __START__ and __END__ has to be at least \`1\` second **`,
            time_incorrect: `%s - ** Please insert a correct __START__ and/or __END__ time (use \`/help boydancer\` for more information) **`,
            endtime_too_big: `%s - ** Please ensure your __END__ time is shorter than the video **`,
            endtime_is_0: `The __END__ time cannot be \`0\` seconds`,
            endtime_incorrect: `%s - ** Please insert a correct __END__ time **`,
            starttime_bigger_than_video: `%s - ** Please make sure your __START__ time is smaller than the video **`,
            starttime_incorrect: `%s - ** Please insert a correct __START__ time **`,
            video_generation: 'Error generating the video:',
            video_geenration_detailed: 'An error occurred while generating the video. (Make sure the Video is not Age Restricted):\n\n||%s||',
            time_over_danceEnd_limit: `%s - ** The time between __START__ and __END__ is over \`%s\` seconds **`,
            // time_over_danceEnd_limit: `%s - ** The time between __START__ and __END__ is over \`${danceEnd}\` seconds **`,
            soundcloud_song_too_big: `%s - ** Please ensure that the __SoundCloud Song__ is __10 minutes (600 seconds)__ or shorter **`,
            youtube_is_livestream: `:blush: ** **- ** Please ensure the __Youtube Video__ is not a __Livestream__ **`,
            youtube_too_long: `%s - ** Please ensure that the __YouTube Video__ is __10 minutes (600 seconds)__ or shorter **`,
            youtube_video_does_not_exist: `%s - ** The __Youtube Video__ you provided Does Not Exist **`,



        },
        generation: `Generating video... <a:boypet2:1168249848055734343>`,
        epilepsy: '\n<:boys:1168248994108030977> EPILEPSY WARNING <:boys:1168248994108030977>\n',
        finished: 'Here is your boydancer:',
        // cooldown: `You are On Cooldown, wait \`${remaining}\``,
        cooldown: `You are On Cooldown, wait \`%s\``,

    }
};
