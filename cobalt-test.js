const fs = require('fs');
const ytdl = require('ytdl-core');
const axios = require('axios');

function getHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.youtube.com/',
        Origin: 'https://www.youtube.com',
    };
}

async function downloadYoutubeAudioFromCobalt(videoUrl) {
    const responseV2 = await axios({
        method: 'POST',
        url: 'https://cobalt-api.kwiatekmiki.com',
        data: JSON.stringify({
            url: videoUrl,
            videoQuality: '720',
            youtubeVideoCodec: 'h264',
            audioFormat: 'wav',
            filenameStyle: 'classic',
            disableMetadata: false,
            downloadMode: 'audio'
        }),
        headers: getHeaders()
    })

    const urlObjectV2 = responseV2.data.url;

    if (responseV2.status !== 200) {
        throw Error(`Error: Something went wrong while fetching the audio file. (${responseV2.error.code || responseV2.text || responseV2.statusText || ''})`);
    }

    console.log(responseV2.data.url);

    const outputPath = `./files/temporaryYoutube/gay.wav`;
    const writer = fs.createWriteStream(outputPath);

    const fileResponse = await axios({ url: urlObjectV2, method: 'GET', responseType: 'blob' });
    fileResponse.data.pipe(writer);

    writer.on('error', (err) => {
          console.error('Error:', err);
    });
}

downloadYoutubeAudioFromCobalt('https://www.youtube.com/watch?v=Kx0jTGd7urs');
