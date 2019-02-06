const io = require('socket.io');


let socket = io.connect('ws://localhost:3000');

socket.emit('message', 'my message')