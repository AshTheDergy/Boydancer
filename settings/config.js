require('dotenv').config();
module.exports = {
    news: {
    	version: '1.2.3',
        new: [
            '- something cool',
            '- something fun',
        ],
	},
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
};
