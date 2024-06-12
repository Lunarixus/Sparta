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

async function YouTubeDownloadAudio(ytDlpWrap, url, outputDir, quality, filename, format, downloadYouTubeThumbnail, getArtistAndTitle) {
    console.log(`Downloading audio with quality: ${quality} in format: ${format}`);

    try {
        const webmFilePath = path.join(outputDir, `${filename}.webm`);
        let audioFilePath;
        let tempFilePath;

        switch (format) {
            case 'flac':
                audioFilePath = path.join(outputDir, `${filename}.flac`);
                tempFilePath = path.join(outputDir, `${filename}_temp.flac`);
                break;
            case 'mp3':
                audioFilePath = path.join(outputDir, `${filename}.mp3`);
                tempFilePath = path.join(outputDir, `${filename}_temp.mp3`);
                break;
            case 'ogg':
                audioFilePath = path.join(outputDir, `${filename}.ogg`);
                tempFilePath = path.join(outputDir, `${filename}_temp.ogg`);
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
                ffmpegCommand = `ffmpeg -y -i "${webmFilePath}" -vn -ar 192000 -ac 2 -f flac "${audioFilePath}"`;
                break;
            case 'mp3':
                ffmpegCommand = `ffmpeg -y -i "${webmFilePath}" -vn -ar 44100 -ac 2 -ab 320k -f mp3 "${audioFilePath}"`;
                break;
            case 'ogg':
                ffmpegCommand = `ffmpeg -y -i "${webmFilePath}" -vn -acodec libvorbis -f ogg "${audioFilePath}"`;
                break;
            default:
                throw new Error('Unsupported audio format');
        }

        console.log('Running command:', ffmpegCommand);
        await executeFFmpegCommand(ffmpegCommand);
        console.log(`Conversion to ${format.toUpperCase()} complete`);

        // Retrieve metadata
        const { artist, title } = await getArtistAndTitle(url);
        const thumbnailFilePath = await downloadYouTubeThumbnail(url);

        // Add metadata and thumbnail
        const metadataCommand = `ffmpeg -y -i "${audioFilePath}" -i "${thumbnailFilePath}" -map 0 -map 1 -metadata artist="${artist}" -metadata title="${title}" -disposition:1 attached_pic -codec copy "${tempFilePath}"`;
        console.log('Running metadata command:', metadataCommand);
        await executeFFmpegCommand(metadataCommand);
        console.log('Metadata and artwork added to the audio file');

        // Replace the original file with the temp file
        await fs.rename(tempFilePath, audioFilePath);

        // Clean up temporary files
        await fs.unlink(webmFilePath);

        return audioFilePath;
    } catch (error) {
        console.error('Error downloading audio:', error);
        throw error;
    }
}

module.exports = {
    YouTubeDownloadAudio
};
