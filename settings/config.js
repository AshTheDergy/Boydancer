require('dotenv').config();
module.exports = {
    news: {
        version: '1.2.5',
        new: [
            '- bug fix',
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
};
