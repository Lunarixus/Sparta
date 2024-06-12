/* utils.js -- Commonly used functions & variables.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const fs = require('fs').promises;
const path = require('path');
const { YouTubeDownloadAudio } = require('./audiodownloader');
const { YouTubeDownloadVideo } = require('./videodownloader');

const DOWNLOADS_DIR = './downloads/';
const THUMBNAILS_DIR = './thumbnails/';

function convertToYouTube(url) {
    if (url.includes('youtube.com')) {
        return url;
    }

    if (url.includes('youtu.be')) {
        const videoId = url.split('/').pop().split('?')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (url.includes('music.youtube.com')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (url.includes('soundcloud.com')) {
        return url;
    }

    throw new Error('Unsupported YouTube URL format');
}

async function convertAndDownloadAudio(ytDlpWrap, url, quality, videoTitle, format, downloadYouTubeThumbnail, getArtistAndTitle) {
    if (typeof url !== 'string') {
        throw new Error('URL is not a string! Report this to the developer.');
    }

    try {
        const YouTubeURL = convertToYouTube(url);
        const filePath = await YouTubeDownloadAudio(ytDlpWrap, YouTubeURL, DOWNLOADS_DIR, quality, videoTitle, format, downloadYouTubeThumbnail, getArtistAndTitle);
        console.log('Got File Path from function:', filePath);
        return filePath;
    } catch (error) {
        console.error('Failed to download video! Report this to the developer.');
        throw error;
    }
}

async function convertAndDownloadVideo(ytDlpWrap, url, quality, videoTitle) {
    if (typeof url !== 'string') {
        throw new Error('URL is not a string! Report this to the developer.');
    }

    try {
        const YouTubeURL = convertToYouTube(url);
        const filePath = await YouTubeDownloadVideo(ytDlpWrap, YouTubeURL, DOWNLOADS_DIR, quality, videoTitle);
        console.log('Got File Path from function:', filePath);
        return filePath;
    } catch (error) {
        console.error('Failed to download video! Report this to the developer.');
        throw error;
    }
}

async function getServiceType(url) {
    try {
        if(url.includes('music.youtube.com')) {
            return 'YouTube Music';
        } else if (url.includes('youtu.be')) {
            return 'YouTube (Shortlink)';
        } else if (url.includes('youtube.com')) {
            return 'YouTube';
        } else if (url.includes('soundcloud.com')) {
            return 'SoundCloud'
        }
    } catch (error) {
        console.error("Failed to detect URL type:", error);
        throw error;
    }
}

function sanitizeFilename(filename) {
    return filename.replace(/[^\w\s.-]/gi, '').replace(/\s+/g, '_');
}

module.exports = {
    DOWNLOADS_DIR,
    THUMBNAILS_DIR,
    convertAndDownloadAudio,
    convertAndDownloadVideo,
    getServiceType,
    sanitizeFilename
};
