/* config.js -- Configuration settings for Sparta's backend, read from config.toml.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const toml = require('toml');
const fs = require('fs');

const config = toml.parse(fs.readFileSync('config.toml', 'utf8'));

module.exports = config;