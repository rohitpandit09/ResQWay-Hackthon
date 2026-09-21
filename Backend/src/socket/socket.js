const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port : 8080
})

wss.on('connection',(socket)=>{
    console.log('Client connected');
})

wss.on('error',(error)=>{
    console.error('WebSocket error:',error);
});

wss.on('close',()=>{
    console.log('Websocket server closed');
})

