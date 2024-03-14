/* index.js -- Init backend.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const http = require('./http');
const { executeFFmpegCommand } = require('./ffmpeg');
const { DOWNLOADS_DIR, THUMBNAILS_DIR, getServiceType} = require('./utils');
const fs = require('fs').promises;
const path = require('path');