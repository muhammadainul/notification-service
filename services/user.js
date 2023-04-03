const debug = require('debug');
const log = debug('notification-service:services:');

const {
    Gambar,
    Users,
    Kewenangan
} = require('../models');

var users = [];

async function GetUsers () {
    log('[User] GetUsers');
    try {
        const userData = await Users.findAll({
            include: [
                { 
                    model: Gambar,
                    attributes: ['filename', 'originalname', 'destination'],
                    as: 'files'
                },
                { 
                    model: Kewenangan,
                    attributes: ['kewenangan'],
                    as: 'kewenangan'
                }
            ],
            order: [['createdAt', 'desc']],
            nest: true,
            raw: true
        });

        return userData;
    } catch (error) {
        return error;
    }
}

async function AddUser (id, username, room) {
    log('[Socket Notification] AddUser', { id, username, room });
    try {
        if (!username && !room) throw { error: 'Username dan Room harus disertakan.' };

        const user = { id, username, room };
        users.push(user);

        return { user };
    } catch (error) {
        return error;
    }
}

async function GetUserSocket (id) {
    log('[Socket Notifiation] GetUserSocket', id);
    try {
        const user = await users.find(user => user.id == id);
        return user;
    } catch (error) {
        return error;
    }
}

async function GetUserRoom (room) {
    log('[Socket Notification] GetUserRoom', room);
    try {
        const user = await users.filter(user => user.room === room);  
        return user; 
    } catch (error) {
        return error;
    }
}

module.exports = {
    GetUsers,
    AddUser,
    GetUserSocket,
    GetUserRoom
}

