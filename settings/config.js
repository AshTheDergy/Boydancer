require('dotenv').config();
module.exports = {
    TOKEN: process.env.TOKEN, //replace with your token
    embed: {
        color: "#220f80",
        wrongcolor: "#8a0808",
        footertext: "Made by AshTheDergy | Fluffy Derg Productions", //you can change this
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
