const debug = require('debug');
const log = debug('notification-service:');

const NotifService = require('../services/notifikasi');

const stage = process.env.NODE_ENV;

function io (io) {
    return {
        initSocket: () => {
            // var socketCount = 0;
            var userOnline = {};

            io.on('connection', (socket) => {
                if (stage === "development") {
                    log('A client connected with id : ' + socket.id)
                }

                socket.on('login', (data) => {
                    log('login', data)
                    userOnline[data.username] = socket.id;
                    socket.username = data.username;
                    log(`${data.username} has joined`);

                    socket.broadcast.emit('get online users', { userOnline });
                });

                socket.on('open-tiket', async (data) => {
                    log('[Socket] create-tiket', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('approve-tiket', async (data) => {
                    log('[Socket] approve-tiket', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('reject-tiket', async (data) => {
                    log('[Socket] reject-tiket', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('assign-tiket', async (data) => {
                    log('[Socket] assign-tiket', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('solve-tiket', async (data) => {
                    log('[Socket] solve-tiket', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('close-tiket', async (data) => {
                    log('[Socket] close-tiket', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('rating', async (data) => {
                    log('[Socket] Rating', data);

                    const result = await NotifService.GetNotif(data);

                    socket.broadcast.emit('get-notif', { 
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result 
                    });
                });

                socket.on('notification', async (data) => {
                    log('[Socket] Notification', data);

                    const result = await NotifService.GetNotif(data);

                    socket.emit('get-notif', {
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result
                    });
                });

                socket.on('read', async (data) => {
                    log('[Socket] read', data);

                    await NotifService.Read(data);

                    const result = await NotifService.GetNotif(data);

                    socket.emit('get-notif', {
                        user_id: data.user_id, 
                        pegawai_id: data.pegawai_id,
                        result
                    });
                });
                
                socket.on('get online users', (room) => {
                    log('Get Online User with Room', room);
                    socket.emit('get online users', { userOnline });
                    chatNS.to(room).emit('notification', { 
                        title: `is joining to room ADMIN`
                    });
                });

                socket.on('logout', (data) => {
                    log('data', data);
                    for (username in userOnline) {
                        if (data.username == username) {
                            log(userOnline[username])
                            delete userOnline[username];
                            socket.broadcast.emit('get online users', { userOnline });
                        }
                    }
                });

                socket.on('disconnect', () => {
                    if (stage === 'development') {
                        console.log(socket.id + " is left")
                    }
                });

                // socket.on('off-socket', (data) => {
                //     if (stage === 'development') {
                //         console.log(socket.id + " is left")
                //     }
                //     if (data.groupId !== undefined) {
                //         socket.leave(data.groupId)
                //     }
                //     redisServer.HDEL('online', data.userId)
                //     socket.emit('off-socket', "User with id : " + data.userId + " is left")
                // });

                // socket.on('typing', (data) => {
                //     if (stage === "development") {
                //         console.log(data.username + " is typing")
                //     }
                //     if (data.recieverSocket != undefined) {
                //         chatNS.to(data.recieverSocket).emit('typing', data.username + " is typing")
                //     }
                // });

                // socket.on('isRead', async (data) => {
                //     let res = await chatHandler.messageRead(data.userId, data.roomId)
                //     if (res) {
                //         return socket.emit('isRead', "All messages in chatroom are readed")
                //     }
                // });

                // socket.on('activated', (data) => {
                //     let user = {
                //         name: data.username,
                //         id: data.userId,
                //         socketId: socket.id
                //     }
                //     redisServer.HSET("online", data.userId, JSON.stringify(user))
                //     if (stage === "development") {
                //         redisServer.HGET("online", data.userId, (err, res) => {
                //             console.log(res)
                //         })
                //     }
                //     socket.emit('activated', socket.id)
                // });

                // socket.on('get-online-users', () => {
                //     redisServer.HKEYS("online", (err, res) => {
                //         if (stage === 'development') {
                //             console.log(res)
                //         }
                //         socket.emit('get-online-users', res)
                //     })
                // });

                // socket.on('detail-user', (data) => {
                //     redisServer.HGET('online', data.userId, (err, res) => {
                //         if (stage === 'development') {
                //             console.log(res)
                //         }
                //         socket.emit('detail-user', res)
                //     })
                // });

                // socket.on('check-online', (data) => {
                //     redisServer.HEXISTS("online", data.userId, (err, res) => {
                //         if (err) throw err
                //         socket.emit('check-online', res)
                //     })
                // });

                // socket.on('chat', async (data) => {
                //     if (data.image != null) {
                //         const base64Data = helper.decodeBase64Image(data.image)
                //         let fileName = data.imageName + new Date().toISOString() + ".jpg"
                //         helper.saveImage(data.creator, fileName, base64Data)
                //         data.imagePath = "/image/" + data.creator + "/" + fileName
                //     }
                //     let res = await roomHandler.createPrivateChat(data)
                //     if (res) {
                //         if (data.recieverSocket != null) {
                //             if (data.imagePath == null) {
                //                 return chatNS.to(data.recieverSocket).emit('chat', data.message)
                //             } else {
                //                 return chatNS.to(data.recieverSocket).emit('chat', data.imagePath)
                //             }
                //         }
                //     } else {
                //         return socket.emit('chat', "Data gagal di simpan ke database")
                //     }
                // });

                // socket.on('leaving-room', (data) => {
                //     chatNS.to(data.roomName).emit('Group Announcement', data.username + " is left " + data.roomName)
                // });

                // socket.on('enter-group', (data) => {
                //     socket.join(data.groupId)
                // });

                // socket.on('create-group', async (data) => {
                //     let groupData = {
                //         participants: data.participants,
                //         name: data.name,
                //         creator: data.id,
                //         type: 'Group'
                //     }
                //     try {
                //         return roomHandler.createGroup(groupData)
                //     } catch (error) {
                //         console.log(error.messages)
                //         throw new Error()
                //     }
                // });
            })

            // io.on('connection', (socket) => {
            //     log('[Socket Notification] Client connected');

            //     socket.on('login', async (data) => {
            //         userOnline[data.username] = socket.id;
            //         socket.username = data.username;
            //         console.log(`${data.username} has joined`);

            //         // const user = await UserService.GetUsers();
            //         socket.broadcast.emit('get online users', { userOnline });
            //     });

            //     socket.on('get online users', async () => {
            //         log('list online');

            //         // const user = await UserService.GetUsers();
            //         socket.emit('get online users', { userOnline });
                    
            //     });

            //     socket.on('logout', (data) => {
            //         log('data', data);
            //         for (username in userOnline) {
            //             if (data.username == username) {
            //                 log(userOnline[username])
            //                 delete userOnline[username];
            //                 socket.broadcast.emit('get online users', { userOnline });
            //                 socket.broadcast.emit('user has left', data);
            //             }
            //         }
            //     });

            //     socket.on('join room admin', async (data) => {
            //         log('[Socket Notification] Join Room Admin', data);

            //         const username = data.username;
            //         const room = 'ADMIN';
            //         // const { user, error } = await UserService.AddUser(socket.id, username, room)
            //         // if (error) return error;

            //         socket.join(room);
            //         io.in(room).emit('notification', { 
            //             title: `${data.username} is joining to room ${room}`
            //         });
            //         log(`${data.username} Connected to Room ${room}`);
            //     });

            //     socket.on('join room', data => {
            //         log('[Socket Notification] Join Room User', data)

            //         // const username = data.reported.username;
            //         const room = `REPORTED-${data.no_tiket}`;
            //         // const { user, error } = await UserService.AddUser(socket.id, username, room);
            //         // if (error) return error;

            //         socket.join(room);
            //         io.to(room).emit('notification', { 
            //             title: `${data.reported.username} is joining to room ${room}`
            //         });
            //         log(`${data.reported.username} Connected to Room ${data.no_tiket}`);
            //     });

            //     socket.on('create tiket', data => {
            //         log('[Socket Notification] Create Tiket', data);

            //         io.to(`REPORTED-${data.no_tiket}`).emit('open tiket', data);
            //         io.to('ADMIN').emit('open tiket', data);
            //     });


            //     // socket.on('join room assign', async data => {
            //     //     log('[Socket Notification] Join Room Assign Data', data);

            //     //     socket.join(`HANDLED-${data.no_tiket}`);
            //     //     log(`User ${data.handled_by} Connected to Room ${data.no_tiket}`);
            //     // });

            //     // socket.on('approve tiket', async (data) => {
            //     //     log('[Socket Notification] Approve Data', data);

            //     //     socket.to(`REPORTED-${data.no_tiket}`).emit('approve tiket', data);
            //     // });

            //     // socket.on('assign tiket', async (data) => {
            //     //     log('[Socket Notification] Assign Tiket', data);

            //     //     socket.to(`REPORTED-${data.no_tiket}`).emit('process tiket', data);
            //     //     socket.to(`HANDLED-${data.no_tiket}`).emit('assign tiket', data);
            //     // });

            //     // socket.on('solved tiket', async (data) => {
            //     //     log('[Socket Notification] Solved Tiket', data);

            //     //     socket.to(`REPORTED-${data.no_tiket}`).emit('solved', data);
            //     //     socket.to(`ADMIN`).emit('solved', data);
            //     // })
            // });
        }
    }
}

module.exports = io;