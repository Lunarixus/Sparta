/* videodownloader.js -- Download Video file from selected platform.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const fs = require('fs').promises;
const path = require('path');
const { executeFFmpegCommand } = require('./ffmpeg');

async function YouTubeDownloadVideo(ytDlpWrap, url, outputDir, quality, filename) {
    console.log('Downloading video with quality:', quality);

    try {
        const mp4FilePath = path.join(outputDir, `${filename}.mp4`);

        const downloadResult = await ytDlpWrap.execPromise([
            url,
            '-f',
            `bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`,
            '-o',
            mp4FilePath
        ]);
        console.log('Download Result:', downloadResult);

        return mp4FilePath;
    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}

module.exports = {
    YouTubeDownloadVideo
};
