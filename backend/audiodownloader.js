/* audiodownloader.js -- Download Audio file from selected platform.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const fs = require('fs').promises;
const path = require('path');
const { executeFFmpegCommand } = require('./ffmpeg');

async function YouTubeDownloadAudio(ytDlpWrap, url, outputDir, quality, filename, format) {
    console.log(`Downloading audio with quality: ${quality} in format: ${format}`);

    try {
        const webmFilePath = path.join(outputDir, `${filename}.webm`);
        let audioFilePath;

        switch (format) {
            case 'flac':
                audioFilePath = path.join(outputDir, `${filename}.flac`);
                break;
            case 'mp3':
                audioFilePath = path.join(outputDir, `${filename}.mp3`);
                break;
            case 'ogg':
                audioFilePath = path.join(outputDir, `${filename}.ogg`);
                break;
            default:
                throw new Error('Unsupported audio format');
        }

        const downloadResult = await ytDlpWrap.execPromise([
            url,
            '-f',
            `bestaudio/${quality}`,
            '-o',
            webmFilePath
        ]);
        console.log('Download Result:', downloadResult);

        let ffmpegCommand;
        switch (format) {
            case 'flac':
                ffmpegCommand = `ffmpeg -i "${webmFilePath}" -vn -ar 192000 -ac 2 -f flac "${audioFilePath}"`;
                break;
            case 'mp3':
                ffmpegCommand = `ffmpeg -i "${webmFilePath}" -vn -ar 44100 -ac 2 -ab 320k -f mp3 "${audioFilePath}"`;
                break;
            case 'ogg':
                ffmpegCommand = `ffmpeg -i "${webmFilePath}" -vn -acodec libvorbis -f ogg "${audioFilePath}"`;
                break;
            default:
                throw new Error('Unsupported audio format');
        }

        console.log('Running command:', ffmpegCommand);
        await executeFFmpegCommand(ffmpegCommand);
        console.log(`Conversion to ${format.toUpperCase()} complete`);

        return audioFilePath;
    } catch (error) {
        console.error('Error downloading audio:', error);
        throw error;
    }
}

module.exports = {
    YouTubeDownloadAudio
};
