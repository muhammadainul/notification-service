const debug = require('debug');
const log = debug('notification-service:services:');

const {
    Tiket,
    Gambar,
    Users,
    Notifikasi
} = require('../models');
const { Op } = require('sequelize');

async function GetNotif (notifData) {
    const { 
        user_id,
        pegawai_id,
    } = notifData;
    log('[Socket] GetNotif', notifData);
    try {
        let whereByUser;
        let whereByUserCount;
        if (user_id !== '') {
            whereByUserCount = {
                user_id,
                read_user: false
            };

            whereByUser = { user_id };
        }

        let whereByPegawai;
        let whereByPegawaiCount;
        // let whereByHandled;
        if (pegawai_id !== '') {
            whereByPegawaiCount = {
                pegawai_id,
                read_pegawai: false
            };

            whereByPegawai = { pegawai_id };

            // whereByHandled = { handled_by: pegawai_id };
        }

        const whereCount = {
            ...whereByUserCount,
            ...whereByPegawaiCount
        };

        const where = {
            ...whereByUser,
            ...whereByPegawai
        };
        
        var [
            // notifByTiket,
            totalNotif, 
            notifData
        ] = await Promise.all([
            // Tiket.count({ where: whereTiket }),
            Notifikasi.count({
                include: [
                    {
                        model: Tiket,
                        as: 'tiket'
                    },
                    {
                        model: Users,
                        as: 'user',
                        include: {
                            model: Gambar,
                            as: 'files'
                        }
                    }
                ],
                where: whereCount
            }),
            Notifikasi.findAll({
                include: [
                    {
                        model: Tiket,
                        attributes: ['no_tiket', 'detail', 'status'],
                        as: 'tiket'
                    },
                    {
                        model: Users,
                        attributes: ['username', 'nama_lengkap'], 
                        as: 'user',
                        include: {
                            model: Gambar,
                            attributes: ['destination', 'filename'],
                            as: 'files'
                        }
                    }
                ],
                where,
                required: true,
                order: [['createdAt', 'desc']],
                nest: true
            })
        ]);

        return { totalNotif, notifData };
    } catch (error) {
        throw error;
    }
}

async function GetNotifPegawai (notifData) {
    const { pegawai_id } = notifData;
    log('[Socket] GetNotifPegawai', notifData);
    try {
        const [totalNotif, notifData] = await Promise.all([
            Notifikasi.count({
                include: [
                    {
                        model: Tiket,
                        as: 'tiket'
                    },
                    {
                        model: Users,
                        as: 'user',
                        include: {
                            model: Gambar,
                            as: 'files'
                        }
                    }
                ],
                where: { 
                    pegawai_id,
                    read_pegawai: false
                }
            }),
            Notifikasi.findAll({
                include: [
                    {
                        model: Tiket,
                        attributes: ['no_tiket', 'detail', 'status'],
                        as: 'tiket'
                    },
                    {
                        model: Users,
                        attributes: ['username', 'nama_lengkap'], 
                        as: 'user',
                        include: {
                            model: Gambar,
                            attributes: ['destination', 'filename'],
                            as: 'files'
                        }
                    }
                ],
                where: { pegawai_id },
                required: true,
                order: [['createdAt', 'desc']],
                nest: true
            })
        ]);

        return { totalNotif, notifData };
    } catch (error) {
        throw error;
    }
}

async function GetNotifUser (notifData) {
    const { user_id = null } = notifData;
    log('[Socket] GetNotifUser', notifData);
    try {
        let whereByUser;
        if (user_id !== '') {
            whereByUser = { user_id };
        }

        const where = {
            ...whereByUser
        };

        const [totalNotif, notifData] = await Promise.all([
            Notifikasi.count({
                include: [
                    {
                        model: Tiket,
                        as: 'tiket'
                    },
                    {
                        model: Users,
                        as: 'user',
                        include: {
                            model: Gambar,
                            as: 'files'
                        }
                    }
                ],
                where: { 
                    read_user: false,
                    user_id 
                }
            }),
            Notifikasi.findAll({
                include: [
                    {
                        model: Tiket,
                        attributes: ['no_tiket', 'detail', 'status'],
                        as: 'tiket'
                    },
                    {
                        model: Users,
                        attributes: ['username', 'nama_lengkap'], 
                        as: 'user',
                        include: {
                            model: Gambar,
                            attributes: ['destination', 'filename'],
                            as: 'files'
                        }
                    }
                ],
                where,
                required: true,
                order: [['createdAt', 'desc']],
                nest: true
            })
        ]);

        return { totalNotif, notifData };
    } catch (error) {
        throw error;
    }
}

async function Read (notifData) {
    const {
        user_id,
        pegawai_id,
    } = notifData;
    log('[Socket] Read', notifData);
    try {
        let updated;
        if (pegawai_id !== '') {
            updated = await Notifikasi.update({
                read_pegawai: true
            },
            { where: { pegawai_id } }
            );
        } else if (user_id !== '') {
            updated = await Notifikasi.update({
                read_user: true
            },
            { where: { user_id } }
            );
        } else {
            return { error: 'Update fail.' };
        }

        return updated;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    GetNotif,
    GetNotifPegawai,
    GetNotifUser,
    Read
}