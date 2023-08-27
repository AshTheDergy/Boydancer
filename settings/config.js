require('dotenv').config();
module.exports = {
    
    ffmpegPath: `C:\\PATH_Programs\\ffmpeg.exe`,
    TOKEN: process.env.TOKEN,
    embed: {
        color: "#220f80",
        wrongcolor: "#8a0808",
        footertext: "Made by AshTheDergy | Fluffy Derg Productions"
    },
    slash: {
        global: true,
        guildID: "924707637659062373",
    },
    options: {
        embedFooter: true,
      },
    emoji: {
        error: "❌",
        success: "✅",
        ping: "🏓",
    },
}