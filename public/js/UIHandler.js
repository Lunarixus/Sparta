/* UIHandler.js -- Sparta's UI Handler.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

function updateConsole(data) {
    const consoleContent = document.getElementById('scrollContent');
    consoleContent.innerHTML += `<pre>${data}</pre>`;
    consoleContent.scrollTop = consoleContent.scrollHeight;
}

async function submitForm() {
    const downloadButton = document.getElementById('downloadButton');
    const progressBar = document.getElementById('progressBar');

    downloadButton.disabled = true;
    downloadButton.style.cursor = 'wait';

    try {
        const url = document.getElementById('url').value;
        const quality = document.getElementById('quality').value;
        const format = document.getElementById('format').value;

        console.log('Starting file download on the server...');
        const response = await fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, quality, format })
        });

        if (!response.ok) {
            throw new Error('Failed to start file download on the server');
        }

        const { filePath, filename } = await response.json();

        const fileUrl = `${filePath}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('File download successful.');

    } catch (error) {
        console.error('Error downloading audio:', error);
        alert('Error downloading audio. Check console for details.');

    } finally {
        downloadButton.disabled = false;
        downloadButton.style.cursor = 'pointer';
        progressBar.style.width = '0%';
    }
}

function handleInputChange() {
    const urlInput = document.getElementById('url');
    const downloadButton = document.getElementById('downloadButton');

    urlInput.addEventListener('input', async () => {
        const url = urlInput.value.trim();

        if (url) {
            downloadButton.disabled = false;
        } else {
            clearVideoInfo();
            downloadButton.disabled = true;
        }

        try {
            const response = await fetch('/queryinfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch video information');
            }

            const data = await response.json();
            updateVideoInfo(data);
        } catch (error) {
            console.error('Error fetching video information:', error);
        }
    });
}

function clearVideoInfo() {
    const videoInfo = document.getElementById('videoInfo');
    const videoTitle = document.getElementById('videoTitle');
    const videoPlatform = document.getElementById('videoPlatform');

    videoTitle.textContent = '';
    videoPlatform.textContent = '';

    videoInfo.style.display = 'none';
}

function updateVideoInfo(data) {
    const videoInfo = document.getElementById('videoInfo');
    const videoTitle = document.getElementById('videoTitle');
    const videoPlatform = document.getElementById('videoPlatform');

    videoTitle.textContent = data.title;

    videoPlatform.innerHTML = `<span style="font-weight: bold; font-size: larger;">Platform:</span> ${data.platform}`;

    videoInfo.style.display = 'block';
}

let isResizing = false;
let isDragging = false;
let lastX = 0;
let lastY = 0;

function startResize(e) {
    if (!isMobileDevice()) {
        isResizing = true;
        lastX = e.touches ? e.touches[0].clientX : e.clientX;
        lastY = e.touches ? e.touches[0].clientY : e.clientY;
    }
}

window.addEventListener('touchstart', startResize);
window.addEventListener('touchmove', resizeWindow);
window.addEventListener('touchend', stopResize);

function stopResize() {
    isResizing = false;
}

function resizeWindow(e) {
    if (!isResizing) return;
    const terminal = document.querySelector('.console-window');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newWidth = clientX - lastX + terminal.offsetWidth;
    const newHeight = clientY - lastY + terminal.offsetHeight;
    terminal.style.width = `${newWidth}px`;
    terminal.style.height = `${newHeight}px`;
    lastX = clientX;
    lastY = clientY;
}

function startDragging(e) {
    if (!isMobileDevice() && isTitleBar(e.target)) {
        isDragging = true;
        const terminal = document.querySelector('.console-window');
        lastX = e.clientX - terminal.getBoundingClientRect().left;
        lastY = e.clientY - terminal.getBoundingClientRect().top;
    }
}

window.addEventListener('mousedown', startDragging);
window.addEventListener('mousemove', dragWindow);
window.addEventListener('mouseup', stopDragging);

function dragWindow(e) {
    if (!isDragging) return;
    const terminal = document.querySelector('.console-window');
    const currentX = e.clientX - lastX;
    const currentY = e.clientY - lastY;
    terminal.style.left = `${currentX}px`;
    terminal.style.top = `${currentY}px`;
}

function stopDragging() {
    isDragging = false;
}

function isMobileDevice() {
    return window.innerWidth <= 1240;
}

function isTitleBar(element) {
    const titleBar = document.querySelector('.title-bar');
    return element === titleBar || titleBar.contains(element);
}

function minimizeWindow() {
    const terminal = document.querySelector('.console-window');
    const minimizedWindow = document.createElement('div');
    minimizedWindow.classList.add('minimized-window');
    minimizedWindow.innerHTML = `
        <div class="menu-icons">
            <button id="green-circle"></button>
            <button id="amber-circle"></button>
            <button id="red-circle"></button>
        </div>
    `;
    minimizedWindow.addEventListener('click', restoreWindow);
    document.body.appendChild(minimizedWindow);
    terminal.style.display = 'none';
}

function restoreWindow() {
    const terminal = document.querySelector('.console-window');
    const minimizedWindow = document.querySelector('.minimized-window');
    minimizedWindow.remove();
    terminal.style.display = 'block';
}

let isMaximized = true;

function toggleMaximize() {
    const terminal = document.querySelector('.console-window');
    if (isMaximized) {
        terminal.style.width = '25%';
        terminal.style.height = '50vh';
        terminal.style.maxWidth = 'auto';
        terminal.style.maxHeight = 'calc(100vh - 40px)';
        terminal.style.top = '20px';
        terminal.style.right = '20px';
    } else {
        terminal.style.width = '100%';
        terminal.style.height = '100%';
        terminal.style.maxWidth = 'none';
        terminal.style.maxHeight = 'none';
        terminal.style.top = '0';
        terminal.style.right = '0';
    }
    isMaximized = !isMaximized;
}

function closeWindow() {
    const terminal = document.querySelector('.console-window');
    terminal.remove();
}

window.onload = function() {
    handleInputChange();
    toggleMaximize();
    minimizeWindow();
};
