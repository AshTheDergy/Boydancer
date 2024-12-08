const fs = require('fs');
const ytdl = require('ytdl-core');
const axios = require('axios');

async function downloadYoutubeAudioFromCobalt(interaction, videoUrl) {
    const id = ytdl.getURLVideoID(videoUrl);

    const response = await axios.get(`https://exyezed.vercel.app/api/cobalt/audio/wav/${id}`);
    const urlObject = response.data.url;
    
    const outputPath = `./files/temporaryYoutube/${interaction.user.id}.wav`;
    const writer = fs.createWriteStream(outputPath);

    const fileResponse = await axios({ url: urlObject, method: 'GET', responseType: 'stream' });
    fileResponse.data.pipe(writer);

    writer.on('error', (err) => {
         console.error('Error:', err);
    });
}

module.exports = { downloadYoutubeAudioFromCobalt };
