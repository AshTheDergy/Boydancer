const { Collection } = require("discord.js");

/**
 * @param {Interaction} interaction
 * @param {String} cmd
 */
function cooldown(interaction, cmd) {
  if (!interaction || !cmd) return;
  let { client, member } = interaction;
  if (!client.cooldowns.has(cmd.name)) {
    client.cooldowns.set(cmd.name, new Collection());
  }
  const now = Date.now();
  const timestamps = client.cooldowns.get(cmd.name);
  const cooldownAmount = cmd.cooldown * 1000;
  if (timestamps.has(member.id)) {
    const expirationTime = timestamps.get(member.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    } else {
      timestamps.set(member.id, now);
      setTimeout(() => timestamps.delete(member.id), cooldownAmount);
      return false;
    }
  } else {
    timestamps.set(member.id, now);
    setTimeout(() => timestamps.delete(member.id), cooldownAmount);
    return false;
  }
}

function toPascalCase(string) {
  if (!string) return;
  const words = string?.match(/[a-z]+/gi);
  if (!words) return "";
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join("");
}

module.exports = { cooldown, toPascalCase };