const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io');

// const redis = require('redis');
// global.redisServer = redis.createClient();
// redisServer.connect();

require('dotenv').config();

const port = process.env.PORT || 3000;

const socket = io(server);
const socketConn = require('./core/socket')(socket);
socketConn.initSocket();

server.listen(port, () => {
    console.log(`${process.env.NAMESPACE} service listening on ${process.env.NODE_ENV} at port ${port}`);
});