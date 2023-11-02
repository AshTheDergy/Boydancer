const fs = require('fs');
const util = require('util');
const { giveSecondsFromTime, cooldownUser, applyAudioWithDelay } = require("./CommonFunctions");
const yts = require('yt-search');
const config = require("../settings/config");

//search functions

async function findVideoUrl(title) {
    return new Promise(async (resolve, reject) => {
        try {
            const r = await yts(title);
            const firstResult = r.videos[0];

            if (!firstResult) {
                reject(new Error('Video not found.'));
            } else {
                resolve(firstResult);
            }
        } catch (err) {
            reject(err);
        }
    });
}

