/* ytdlpclient.js -- yt-dlp-wrap functions for getting YouTube information.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const YTDlpWrap = require('yt-dlp-wrap').default;
const which = require('which');
import('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const { DOWNLOADS_DIR, THUMBNAILS_DIR } = require('./utils');
const { executeFFmpegCommand } = require('./ffmpeg');

const config = require('./config');

const ytDlpName = process.platform === 'win32' ? 'YoutubeDL' : 'yt-dlp';
const ytDlpBinaryPath = which.sync(ytDlpName);
const ytDlpWrap = new YTDlpWrap(ytDlpBinaryPath);

async function downloadYouTubeThumbnail(url) {
    try {
        const videoId = url.split('v=')[1].split('&')[0];
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        const response = await fetch(thumbnailUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch thumbnail');
        }
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
        const thumbnailFilePath = path.join(THUMBNAILS_DIR, `${videoId}.jpg`);
        await fs.writeFile(thumbnailFilePath, imageBuffer);
        console.log('Thumbnail saved locally:', thumbnailFilePath);
        return thumbnailFilePath;
    } catch (error) {
        console.error('Error downloading YouTube thumbnail:', error);
        throw error;
    }
}

async function downloadSoundCloudArtwork(url) {
    try {
        const soundCloudApiKey = config.soundcloud.api_key;

        if (!soundCloudApiKey) {
            console.log('SoundCloud API key is empty. Skipping SoundCloud artwork download.');
            return null;
        }

        const trackId = url.split('/').pop();        
        const apiUrl = `https://api.soundcloud.com/tracks/${trackId}?client_id=${soundCloudApiKey}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch SoundCloud track metadata');
        }
        const trackData = await response.json();

        if (!trackData.artwork_url) {
            throw new Error('No artwork available for the SoundCloud track');
        }

        const artworkUrl = trackData.artwork_url.replace('-large', '-t500x500');
        const artworkResponse = await fetch(artworkUrl);
        if (!artworkResponse.ok) {
            throw new Error('Failed to fetch SoundCloud artwork');
        }
        const artworkBuffer = Buffer.from(await artworkResponse.arrayBuffer());

        await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
        const artworkFilePath = path.join(THUMBNAILS_DIR, `${trackId}.jpg`);
        await fs.writeFile(artworkFilePath, artworkBuffer);
        
        console.log('Artwork saved locally:', artworkFilePath);
        return artworkFilePath;
    } catch (error) {
        console.error('Error downloading SoundCloud artwork:', error);
        throw error;
    }
}

async function getArtistAndTitle(videoUrl) {
    try {
        console.log('Getting title and artist for video:', videoUrl);
        const metadata = await ytDlpWrap.getVideoInfo(videoUrl, '--format', 'bestaudio/b');
        console.log('Title obtained:', metadata.title);

        let artist;
        if (metadata.artist) {
            artist = metadata.artist;
        } else if (metadata.uploader) {
            artist = metadata.uploader;
        } else {
            artist = 'Unknown';
        }

        console.log('Artist obtained:', artist);
        return { artist, title: metadata.title };
    } catch (error) {
        console.error('Error getting video title and artist:', error);
        throw error;
    }
}

module.exports = {
    ytDlpWrap,
    downloadYouTubeThumbnail,
    downloadSoundCloudArtwork,
    getArtistAndTitle,
};
