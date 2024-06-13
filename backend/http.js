/* http.js -- Set up HTTP and HTTPS servers and API endpoints.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const express = require('express');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');  // Use the synchronous fs module
const path = require('path');
const config = require('./config');
const { downloadYouTubeThumbnail, getArtistAndTitle, ytDlpWrap } = require('./ytdlpclient');
const { DOWNLOADS_DIR, THUMBNAILS_DIR, convertAndDownloadAudio, convertAndDownloadVideo, getServiceType, sanitizeFilename } = require('./utils');

const app = express();
let server = {};

if (config.https.enabled) {
    const httpsOptions = {
        key: fs.readFileSync(config.https.keyPath),
        cert: fs.readFileSync(config.https.certPath)
    };
    server = https.createServer(httpsOptions, app);
} else {
    server = http.createServer(app);
}

const wss = new WebSocket.Server({ server });

const PORT = config.http.port;

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

app.use('/downloads', express.static(DOWNLOADS_DIR));
app.use('/thumbnails', express.static(THUMBNAILS_DIR));
app.use('/public/img', express.static('/public/img'));

wss.on('connection', function connection(ws) {
    console.log('WebSocket connected');

    const sendLogs = (message) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ log: message }));
        }
    };

    const originalConsoleLog = console.log;
    console.log = function (...args) {
        sendLogs(args.join(' '));
        originalConsoleLog.apply(console, args);
    };

    const originalConsoleError = console.error;
    console.error = function (...args) {
        sendLogs(args.join(' '));
        originalConsoleError.apply(console, args);
    };
});

app.get('/getIpAddress', (req, res) => {
    const ipAddresses = req.socket.address();
    let ipv4Address = null;
    let ipv6Address = null;

    if (ipAddresses.hasOwnProperty('address')) {
        if (req.socket.localFamily === 'IPv6') {
            ipv6Address = ipAddresses.address;
        } else {
            ipv4Address = ipAddresses.address;
        }
    }

    if (!ipv4Address) {
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const net of interfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    ipv4Address = net.address;
                } else if (net.family === 'IPv6' && !net.internal) {
                    ipv6Address = net.address;
                }
            }
        }
    }

    if (!ipv4Address) {
        ipv4Address = ipv6Address === '::1' ? '127.0.0.1' : ipv6Address;
    }

    console.log("Get IP Address : ", ipv4Address);
    res.json({ ipAddress: ipv4Address, port: PORT });
});

app.post('/download', async (req, res) => {
    const { url, quality, format } = req.body;

    try {
        let filePath;
        let contentType;

        // Get artist and title information
        const { artist, title } = await getArtistAndTitle(url);
        let sanitizedFilename = sanitizeFilename(title);

        if (format === 'flac' || format === 'mp3' || format === 'ogg') {
            filePath = await convertAndDownloadAudio(ytDlpWrap, url, quality, sanitizedFilename, format, downloadYouTubeThumbnail, getArtistAndTitle);
            contentType = `audio/${format}`;
            sanitizedFilename += `.${format}`;
        } else if (format === 'mp4') {
            filePath = await convertAndDownloadVideo(ytDlpWrap, url, quality, sanitizedFilename);
            contentType = 'video/mp4';
            sanitizedFilename += '.mp4';
        }

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        res.status(200).send({ filePath, filename: sanitizedFilename });
    } catch (error) {
        console.error('Error downloading or sending file:', error);
        res.status(500).send('Failed to download or send file. Check server logs for details.');
    }
});

app.post('/queryinfo', async (req, res) => {
    const { url } = req.body;

    try {
        const { artist, title } = await getArtistAndTitle(url);
        const videoPlatform = await getServiceType(url);
        const responseData = {
            artist: artist,
            title: title,
            platform: videoPlatform
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error getting video information:', error);
        res.status(500).json({ error: 'Failed to get video information. Check server logs for details.' });
    }
});

app.post('/thumbnail', async (req, res) => {
    const { url } = req.body;

    try {
        const serviceType = await getServiceType(url);
        let thumbnailFilePath;
        
        if (serviceType === 'YouTube' || serviceType === 'YouTube (Shortlink)' || serviceType === 'YouTube Music') {
            thumbnailFilePath = await downloadYouTubeThumbnail(url);
        } else if (serviceType === 'SoundCloud') {
            if (!config.soundcloud || !config.soundcloud.api_key) {
                console.log('SoundCloud API key is not provided. Skipping SoundCloud artwork download.');
                res.status(200).send({ thumbnailFilePath: null });
                return;
            }
            thumbnailFilePath = await downloadSoundCloudArtwork(url);
        } else {
            throw new Error('Unsupported service type');
        }

        res.json({ thumbnailFilePath });
    } catch (error) {
        console.error('Error handling thumbnail request:', error);
        res.status(500).send('Failed to download thumbnail. Check server logs for details.');
    }
});

app.post('/thumbnail/complete', async (req, res) => {
    const { thumbnailFilePath } = req.body;

    try {
        if (thumbnailFilePath && thumbnailFilePath !== '/img/soundcloudlogo.png') {
            await fs.promises.unlink(thumbnailFilePath);
            console.log('Thumbnail deleted:', thumbnailFilePath);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling thumbnail completion:', error);
        res.status(500).send('Failed to complete thumbnail download. Check server logs for details.');
    }
});

server.listen(PORT, () => {
    console.log(`Server running on ${config.https.enabled ? 'HTTPS' : 'HTTP'} port ${PORT}`);
});

module.exports = {
    downloadYouTubeThumbnail,
    getArtistAndTitle,
};
