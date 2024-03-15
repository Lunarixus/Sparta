/* thumbnailGrabber.js -- Grab a YouTube Thumbnail and display it.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

async function fetchThumbnail(url) {
    try {
        if (url.includes('soundcloud.com')) {
            return await fetchSoundCloudArtwork(url);
        } else if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('music.youtube.com')) {
            return await fetchYouTubeThumbnail(url);
        } else {
            console.log('Unsupported service type');
            return null;
        }
    } catch (error) {
        console.error('Error fetching thumbnail:', error);
        throw error;
    }
}

async function fetchYouTubeThumbnail(url) {
    try {
        const response = await fetch('/thumbnail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        if (!response.ok) {
            throw new Error('Failed to fetch thumbnail');
        }
        const data = await response.json();

        return data.thumbnailFilePath;
    } catch (error) {
        console.error('Error fetching YouTube thumbnail:', error);
        throw error;
    }
}

async function fetchSoundCloudArtwork(url) {
    try {
        const response = await fetch('/thumbnail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.thumbnailFilePath && data.thumbnailFilePath !== '/img/soundcloudlogo.png') {
                return data.thumbnailFilePath;
            } else {
                console.log('Using placeholder thumbnail for SoundCloud artwork.');
                return '/img/soundcloudlogo.png';
            }
        } else {
            console.log('Failed to fetch SoundCloud artwork. Using placeholder.');
            return '/img/soundcloudlogo.png';
        }
    } catch (error) {
        console.error('Error fetching SoundCloud artwork:', error);
        throw error;
    }
}


function setBackgroundBlur(imageUrl) {
    const backgroundContainer = document.getElementById('backgroundContainer');
    backgroundContainer.style.backgroundImage = `url('${imageUrl}')`;
    backgroundContainer.style.backgroundSize = '100% 100%';
    backgroundContainer.style.filter = 'blur(10px)';
    backgroundContainer.style.display = 'block';
}

function setThumbnail(imageUrl) {
    const thumbnailElement = document.getElementById('thumbnail');
    thumbnailElement.src = imageUrl;
    thumbnailElement.style.width = '100%';
    thumbnailElement.style.height = '100%';
    thumbnailElement.style.maxWidth = '100%';
    thumbnailElement.style.maxHeight = '100%';
    thumbnailElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    thumbnailElement.style.border = '2px solid #ffffff';
    thumbnailElement.style.display = 'block';
    thumbnailElement.style.margin = 'auto';
}

let lastProcessedUrl = '';

function correctYouTubeURL(url) {
    if (url.includes('youtu.be')) {
        const videoId = url.split('/').pop().split('?')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url.includes('youtube.com')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url.includes('music.youtube.com')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return url;
}

async function grabThumbnail(url) {
    try {
        const correctedUrl = correctYouTubeURL(url);

        if (correctedUrl === lastProcessedUrl) {
            console.log('URL has not changed. Skipping thumbnail retrieval.');
            return;
        }

        const thumbnailFilePath = await fetchThumbnail(correctedUrl);
        setBackgroundBlur(thumbnailFilePath);
        setThumbnail(thumbnailFilePath);
        lastProcessedUrl = correctedUrl;

        setTimeout(async () => {
            try {
                await fetch('/thumbnail/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ thumbnailFilePath })
                });

                console.log('Thumbnail deleted:', thumbnailFilePath);
            } catch (error) {
                console.error('Error completing thumbnail download:', error);
            }
        }, 1000);
    } catch (error) {
        console.error('Error grabbing thumbnail:', error);
    }
}

document.getElementById('url').addEventListener('input', function(event) {
    const url = event.target.value.trim();

    if (url === '') {
        document.getElementById('backgroundContainer').style.backgroundImage = 'none';
        document.getElementById('backgroundContainer').style.filter = 'none';
        return;
    }

    grabThumbnail(url);
});
