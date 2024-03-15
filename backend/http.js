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
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { ytDlpWrap, downloadYouTubeThumbnail, getTitle } = require('./ytdlpclient');
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
    const ipAddress = req.socket.localAddress;
    res.json({ ipAddress });
});

app.post('/download', async (req, res) => {
    const { url, quality, format } = req.body;

    try {
        let filePath;
        let contentType;
        let videoTitle = await getTitle(url);
        let sanitizedFilename = sanitizeFilename(videoTitle);

        if (format === 'flac') {
            filePath = await convertAndDownloadAudio(ytDlpWrap, url, quality, sanitizedFilename, format);
            contentType = 'audio/flac';
            sanitizedFilename += '.flac';
        } else if (format === 'mp3') {
            filePath = await convertAndDownloadAudio(ytDlpWrap, url, quality, sanitizedFilename, format);
            contentType = 'audio/mp3';
            sanitizedFilename += '.mp3';
        } else if (format === 'ogg') {
            filePath = await convertAndDownloadAudio(ytDlpWrap, url, quality, sanitizedFilename, format);
            contentType = 'audio/ogg';
            sanitizedFilename += '.ogg';
        } else if (format === 'mp4') {
            filePath = await convertAndDownloadVideo(ytDlpWrap, url, quality, sanitizedFilename);
            contentType = 'video/mp4';
            sanitizedFilename += '.mp4';
        }

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

app.post('/deletePreviousFile', async (req, res) => {
    const { previousFilePath } = req.body;

    try {
        const fullPath = path.join(DOWNLOADS_DIR, previousFilePath);
        await fs.unlink(fullPath);
        console.log('Previous file deleted:', fullPath);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting previous file:', error);
        res.status(500).send('Failed to delete previous file. Check server logs for details.');
    }
});

app.post('/queryinfo', async (req, res) => {
    const { url } = req.body;

    try {
        const videoTitle = await getTitle(url);
        const videoPlatform = await getServiceType(url);
        const responseData = {
            title: videoTitle,
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
        const thumbnailFilePath = await downloadYouTubeThumbnail(url);
        res.json({ thumbnailFilePath });
    } catch (error) {
        console.error('Error handling thumbnail request:', error);
        res.status(500).send('Failed to download YouTube thumbnail. Check server logs for details.');
    }
});

app.post('/thumbnail/complete', (req, res) => {
    const { thumbnailFilePath } = req.body;

    try {
        fs.unlink(thumbnailFilePath)
        .then(() => console.log('Thumbnail deleted:', thumbnailFilePath))
        .catch(error => console.error('Error deleting thumbnail:', error));

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling thumbnail completion:', error);
        res.status(500).send('Failed to complete thumbnail download. Check server logs for details.');
    }
});

server.listen(PORT, () => {
    console.log(`Server running on ${config.https.enabled ? 'HTTPS' : 'HTTP'} port ${PORT}`);
});
