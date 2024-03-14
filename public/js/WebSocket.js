/* WebSocket.js -- Get IPv4 Address of server and connect to WebSocket.
 *
 * Copyright (C) 2024 Lunarixus.
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

async function connectWebSocketAndGetIpAddress() {
    try {
        const response = await fetch('/getIpAddress');
        const { ipAddress } = await response.json();
        const ipv4Address = ipAddress.split(':').pop(); 
        const socket = new WebSocket(`ws://${ipv4Address}:80`);
        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.log) {
                updateConsole(data.log); 
            } else if (data.stderr) {
                updateConsole(data.stderr); 
            }
        };
    } catch (error) {
        console.error('Error getting IP address:', error);
    }
}

connectWebSocketAndGetIpAddress();
