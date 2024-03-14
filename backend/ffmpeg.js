/* ffmpeg.js -- FFmpeg Wrapper functions.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const { exec } = require('child_process');

async function executeFFmpegCommand(command) {
    return new Promise((resolve, reject) => {
        const childProcess = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('FFmpeg execution error:', error);
                reject(error);
            } else {
                console.log('FFmpeg command completed successfully');
                resolve(stdout);
            }
        });

        childProcess.stderr.on('data', (data) => {
            console.error('FFmpeg stderr:', data.toString());
        });
    });
}

module.exports = {
    executeFFmpegCommand,
};
