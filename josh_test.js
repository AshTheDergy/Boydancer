const Josh = require("@joshdb/core");
const provider = require("@joshdb/json");

const interaction_db = new Josh({
    name: "interaction_db",
    provider: provider,
});

(async () => {
    // await interaction_db.set("test data");
    await interaction_db.delete("test data");

    // console.log(await interaction_db.get("test data"));

    console.log(await interaction_db.has("test data"));

    // Usage to set a Discord User ID:
    // await interaction_db.set("Discord User ID");

    // Usage to un-set a Discord User ID:
    // await interaction_db.delete("Discord User ID");

    // Will return true if the User ID is in the DB, false if not
    // await interaction_db.has("test data")
})();