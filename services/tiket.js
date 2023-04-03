const debug = require('debug');
const log = debug('notification-service:services:');

const { isBoolean, isEmpty, toUpper } = require('lodash');

const moment = require('moment');

const {
    Tiket,
    Gambar,
    Tracking,
    Users,
    Kewenangan,
    Teknisi, 
    Pegawai,
    Departemen,
    Jabatan,
    Kategori,
    Komentar,
    Level,
    Logs
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

const { Upload } = require('../helpers/upload');

async function Create (tiketData, user, tiketFiles) {
    const {
        kategori_id,
        user_id, // untuk insert log
        judul,
        detail,
        telepon,
        email
    } = tiketData;
    log('[Tiket] Create', { tiketData, user, tiketFiles });
    try {
        if (!kategori_id) throw { error: 'Kategori harus dipilih.' };

        const checkKategori = await Kategori.findOne({
            where: { id: kategori_id },
            raw: true
        });
        if (!checkKategori) throw { error: 'Kategori tidak tersedia.' };

        const start = 'T-';
        const end = moment().format('YYYYMMDD') + Math.random()
        .toString(36).slice(5);
        const no_tiket = toUpper(start + end);

        if (!isEmpty(tiketFiles)) {
            const destination = process.env.DESTINATION_IMAGE;
            const path = process.env.PATH_IMAGE;
            var createImage = await Gambar.create({
                originalname: tiketFiles.originalname,
                encoding: tiketFiles.encoding,
                mimetype: tiketFiles.mimetype,
                destination,
                filename: tiketFiles.filename,
                path,
                size: tiketFiles.size
            });

            var created = await Tiket.create({
                no_tiket,
                created_by: user.id,
                reported_by: user_id,
                kategori_id,
                judul,
                detail, 
                telepon,
                email,
                status: 0, // menunggu persetujuan dari operator
                gambar_id: createImage.id
            });

            await Upload(tiketFiles);
        } else {
            var created = await Tiket.create({
                no_tiket,
                created_by: user.id,
                reported_by: user_id,
                kategori_id,
                judul,
                detail, 
                telepon,
                email,
                status: 0, // menunggu persetujuan dari operator
            });
        }

        await Tracking.create({
            tiket_id: created.id,
            user_id,
            status: 'Tiket dibuat'
        });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Open) tiket dengan judul ${judul}.`,
            user_id: user.id
        });

        return {
            message: 'Tiket berhasil dibuat.',
            data: await Tiket.findOne({
                where: { id: created.id },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function ApprovedIn (tiketId, tiketData, user) {
    const { 
        level_id, 
        approved,
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] Approved', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!approved || !level_id || !user_id) 
            throw { error: 'Approved / level_id / user_id harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkLevel = await Level.findOne({
            where: { id: level_id },
            raw: true
        });
        if (!checkLevel) throw { error: 'Level tidak tersedia.' };

        if (approved == true) {
            await Tiket.update({
                status: 1, // tiket disetujui operator
                level_id
            }, 
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: 'Tiket disetujui'
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Approved) tiket disetujui.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil di-approve.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        }
    } catch (error) {
        return error;
    }
}

async function Assign (tiketId, tiketData, user) {
    const { 
        assign, 
        handled_by,
        user_id 
    } = tiketData;
    log('[Tiket] Assign', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!assign || !handled_by || !user_id) 
            throw { error: 'Assign / handled_by / user_id harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: handled_by },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        const checkPegawai = await Pegawai.findOne({
            where: { user_id: handled_by },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia' };

        if (checkUser.kewenangan_id == 1) {
            await Tiket.update({
                status: 2, // tiket diberikan kepada admin,
                handled_by: checkPegawai.id,
                tanggal_proses: sequelize.fn('now')
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket diproses oleh admin ${checkUser.username}`
            });
        } else if (checkUser.kewenangan_id == 2) {
            await Tiket.update({
                status: 3, // tiket assign to me (operator),
                handled_by: checkPegawai.id,
                tanggal_proses: sequelize.fn('now')
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket diproses oleh operator ${checkUser.username}`,
            });
        } else if (checkUser.kewenangan_id == 3) {
            await Tiket.update({
                status: 4, // tiket diberikan kepada staff ahli,
                handled_by: checkPegawai.id,
                tanggal_proses: sequelize.fn('now')
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket diproses oleh staff ${checkUser.username}`,
            });
        } else {
            await Tiket.update({
                status: 5, // tiket diberikan kepada teknisi,
                handled_by: checkPegawai.id,
                tanggal_proses: sequelize.fn('now')
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket diproses oleh teknisi ${checkUser.username}`,
            });
        }

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Assign) tiket`,
            user_id: user.id
        });

        return {
            message: 'Tiket berhasil di-assign.',
            data: await Tiket.findOne({
                where: { id: tiketId },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Approved (tiketId, tiketData, user) {
    const { 
        approved, 
        user_id  // untuk insert log
    } = tiketData;
    log('[Tiket] Approved by Teknisi', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!approved || !user_id) throw { error: 'Approved / user_id harus dilampirkan.' };

        if (!isBoolean(approved)) throw { error: 'Approved tidak sesuai.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        if (approved == true) {
            await Tiket.update({
                status: 3, // tiket disetujui oleh teknisi,
                tanggal_proses: sequelize.fn('now')
            }, 
            { where: { id: tiketId } }
            );
            
            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Diproses oleh ${checkUser.username}`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Approved) proses tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil di-approve.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            // Tiket tidak di approve oleh teknisi
            if (!reason) throw { error: 'Alasan harus diisi.' };

            await Tiket.update({
                status: 1, // admin kembali memilih teknisi
                handled_by: null,
                alasan: reason
            },
            { where: { id: tiketId } }
            );   

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Pemilihan teknisi`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Reject) tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket rejected.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        }
    } catch (error) {
        return error;
    }
}

async function Update (tiketId, tiketData, user) {
    const { 
        komentar,
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] Update', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!komentar || !user_id) 
            throw { error: 'Komentar / User ID harus dilampirkan.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        await Komentar.create({
            tiket_id: tiketId,
            user_id: user.id,
            komentar
        });

        await Logs.create({
            ip_address: user.ip_address,
            browser: user.browser,
            browser_version: user.browser_version,
            os: user.os,
            logdetail: `(Update) memberikan komentar ${komentar}.`,
            user_id: user.id
        });

        return {
            message: 'Tiket berhasil diubah.',
            data: await Tiket.findOne({
                where: { id: tiketId },
                raw: true
            })
        };
    } catch (error) {
        return error;
    }
}

async function Solved (tiketId, tiketData, user) {
    const { solved, user_id } = tiketData;
    log('[Tiket] Solved', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        if (solved == true) {
            await Tiket.update({
                status: 6,
                progress: 100,
                tanggal_selesai: sequelize.fn('now')    
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user_id,
                status: `Tiket solved`
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Solved) tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil diselesaikan.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            throw { error: 'Tiket gagal diselesaikan.' };
        }
    } catch (error) {
        return error;
    }
}

async function Pending (tiketId, tiketData, user) {
    const { 
        pending, 
        reason, 
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] Pending', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!pending || !reason || !user_id) 
            throw { error: 'Pending / reason / user_id harus dilampirkan,'};
        
        if (!isBoolean(pending)) throw { error: 'Pending tidak sesuai.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        if (pending == true && reason !== '') {
            await Tiket.update({
                status: 4, // tiket dipending oleh teknisi
                alasan: reason
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: `Tiket ditunda oleh ${checkUser.username}`,
                deskripsi: reason
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(Pending) tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil di-pending.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            return { message: 'Tiket gagal di-pending.' };
        }
    } catch (error) {
        return error;
    }
}

async function ForwardTo (tiketId, tiketData, user) {
    const { 
        forward_to, 
        reason, 
        user_id // untuk insert log
    } = tiketData;
    log('[Tiket] ForwardTo', { tiketId, tiketData, user });
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        if (!forward_to || !reason || !user_id) 
            throw { error: 'Forward_to / reason / user_id harus dilampirkan.' };

        if (!isBoolean(forward_to)) throw { error: 'Forward_to tidak sesuai.' };

        const checkUser = await Users.findOne({
            where: { id: user_id },
            raw: true
        });
        if (!checkUser) throw { error: 'User tidak tersedia.' };

        if (forward_to == true) {
            await Tiket.update({
                status: 5, // tiket di forward / tiket dikembalikan kepada admin
                handled_by: null,
                tanggal_proses: null,
                alasan: reason
            },
            { where: { id: tiketId } }
            );

            await Tracking.create({
                tiket_id: tiketId,
                user_id: user.id,
                status: 'Tiket dikembalikan kepada admin',
                deskripsi: reason
            });

            await Logs.create({
                ip_address: user.ip_address,
                browser: user.browser,
                browser_version: user.browser_version,
                os: user.os,
                logdetail: `(forward) tiket.`,
                user_id: user.id
            });

            return {
                message: 'Tiket berhasil dikembalikan kepada admin.',
                data: await Tiket.findOne({
                    where: { id: tiketId },
                    raw: true
                })
            };
        } else {
            return { message: 'Tiket gagal dikembalikan kepada admin.' };
        }
    } catch (error) {
        return error;
    }
}

async function GetById (tiketId) {
    log('[Tiket] GetById', tiketId);
    try {
        const checkTiket = await Tiket.findOne({
            where: { id: tiketId },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const tiketData = await Tiket.findOne({
            attributes: [
                'id',
                'no_tiket',
                'judul',
                'detail',
                'status',
                'progress',
                ['createdAt', 'tanggal_tiket'],
                'tanggal_proses',
                'tanggal_selesai',
                'kategori_id',
                'level_id',
                'alasan'
            ],  
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap']
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon']
                },
                {
                    model: Pegawai,
                    attributes: ['user_id', 'departemen_id', 'jabatan_id'],
                    as: 'handled',
                    include: [
                        {
                            model: Users,
                            attributes: [
                                'nip', 
                                'username', 
                                'nama_lengkap', 
                                'email', 
                                'telepon', 
                                'alamat'
                            ],
                            as: 'user',
                            include: {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            }
                        },
                        {
                            model: Departemen,
                            attributes: ['nama'],
                            as: 'departemen'
                        },
                        {
                            model: Jabatan,
                            attributes: ['nama_jabatan'],
                            as: 'jabatan'
                        },
                        { 
                            model: Teknisi,
                            attributes: ['id'],
                            as: 'teknisi',
                            include: {
                                model: Kategori,
                                as: 'kategori',
                                attributes: ['kategori']
                            }
                        }
                    ]
                },
                {
                    model: Level,
                    as: 'level',
                    attributes: ['level', 'deskripsi']
                },
                {
                    model: Kategori,
                    as: 'kategori',
                    attributes: ['kategori']
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                }
            ],
            where: { id: tiketId },
            nest: true
        });

        return {
            data: tiketData
        };
    } catch (error) {
        return error;
    }
}

async function GetByTiket (no_tiket) {
    log('[Tiket] GetByTiket', no_tiket);
    try {
        if (!no_tiket) throw { error: 'Nomor tiket harus dilampirkan.' };

        const checkTiket = await Tiket.findOne({
            where: { no_tiket },
            raw: true
        });
        if (!checkTiket) throw { error: 'Tiket tidak tersedia.' };

        const tiketData = await Tiket.findOne({
            attributes: [
                'id',
                'no_tiket',
                'judul',
                'detail',
                'status',
                'progress',
                ['createdAt', 'tanggal_tiket'],
                'tanggal_proses',
                'tanggal_selesai',
                'kategori_id',
                'level_id',
                'alasan'
            ],  
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap']
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon']
                },
                {
                    model: Pegawai,
                    attributes: ['user_id', 'departemen_id', 'jabatan_id'],
                    as: 'handled',
                    include: [
                        {
                            model: Users,
                            attributes: [
                                'nip', 
                                'username', 
                                'nama_lengkap', 
                                'email', 
                                'telepon', 
                                'alamat'
                            ],
                            as: 'user',
                            include: {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            }
                        },
                        {
                            model: Departemen,
                            attributes: ['nama'],
                            as: 'departemen'
                        },
                        {
                            model: Jabatan,
                            attributes: ['nama_jabatan'],
                            as: 'jabatan'
                        },
                        { 
                            model: Teknisi,
                            attributes: ['id'],
                            as: 'teknisi',
                            include: {
                                model: Kategori,
                                as: 'kategori',
                                attributes: ['kategori']
                            }
                        }
                    ]
                },
                {
                    model: Level,
                    as: 'level',
                    attributes: ['level', 'deskripsi']
                },
                {
                    model: Kategori,
                    as: 'kategori',
                    attributes: ['kategori']
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                }
            ],
            where: { id: tiketId },
            nest: true
        });

        return {
            data: tiketData
        };
    } catch (error) {
        return error;
    }
}

async function GetByEmployee (pegawai_id) {
    log('[Tiket] GetByEmployee', pegawai_id);
    try {
        const checkPegawai = await Pegawai.findOne({
            where: { id: pegawai_id },
            raw: true
        });
        if (!checkPegawai) throw { error: 'Pegawai tidak tersedia.' };

        const tiketData = await Tiket.findAll({
            attributes: ['id', 'no_tiket', 'judul', 'progress'],
            include: [
                {
                    model: Gambar,
                    as: 'files',
                    attributes: ['filename', 'destination']
                },
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap'],
                    required: true,
                    duplicating: false
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                    required: true,
                    duplicating: false
                },
                {
                    model: Pegawai,
                    attributes: ['user_id', 'departemen_id', 'jabatan_id'],
                    as: 'handled',
                    include: [
                        {
                            model: Users,
                            attributes: [
                                'nip', 
                                'username', 
                                'nama_lengkap', 
                                'email', 
                                'telepon', 
                                'alamat'
                            ],
                            as: 'user',
                            required: true,
                            duplicating: false,
                            include: {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            }
                        },
                        {
                            model: Departemen,
                            attributes: ['nama'],
                            as: 'departemen'
                        },
                        {
                            model: Jabatan,
                            attributes: ['nama_jabatan'],
                            as: 'jabatan'
                        },
                        { 
                            model: Teknisi,
                            attributes: ['id'],
                            as: 'teknisi',
                            include: {
                                model: Kategori,
                                as: 'kategori',
                                attributes: ['kategori']
                            }
                        }
                    ]
                },
                {
                    model: Level,
                    as: 'level',
                    attributes: ['level', 'deskripsi']
                },
                {
                    model: Kategori,
                    as: 'kategori',
                    attributes: ['kategori']
                },
                {
                    model: Tracking,
                    as: 'tracking', 
                    attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                    include: {
                        model: Users,
                        as: 'user',
                        attributes: ['username', 'nama_lengkap']
                    }
                },
                {
                    model: Komentar,
                    as: 'komentar',
                    attributes: ['tiket_id', 'user_id', 'komentar'],
                    include: {
                        model: Users,
                        attributes: ['nama_lengkap'],
                        as: 'user',
                        include: [
                            {
                                model: Kewenangan,
                                attributes: ['kewenangan'],
                                as: 'kewenangan'
                            },
                            {
                                model: Gambar,
                                attributes: ['destination', 'filename'],
                                as: 'files'
                            }
                        ]
                    }
                }
            ],
            where: { handled_by: pegawai_id },
            nest: true
        });

        return tiketData;
    } catch (error) {
        return error;
    }
}

async function GetDatatables (tiketData) {
    const { 
        draw, 
        order, 
        start, 
        length, 
        search,
        username, 
        nama_lengkap,
        no_tiket,
        judul,
        status,
        kategori_id,
        level_id,
        pegawai_id,
        user_id,
        startDate,
        endDate,
        urutan
    } = tiketData;
    log('[Tiket] GetDatatables', tiketData);
    try {
        let whereByNoTiket;
        if (no_tiket !== '') {
            whereByNoTiket = {
                no_tiket: { [Op.iLike]: `%${no_tiket}%` }   
            };
        };

        let whereByUsernameReported;
        if (username !== '') {
            whereByUsernameReported = {
                '$reported.username$': { [Op.iLike]: `%${username}%` }   
            }
        };

        let whereByNamaLengkapReported;
        if (nama_lengkap !== '') {
            whereByNamaLengkapReported = {
                '$reported.nama_lengkap$': { [Op.iLike]: `%${nama_lengkap}%` }   
            };
        };

        let whereByJudul;
        if (judul !== '') {
            whereByJudul = {
                judul: { [Op.iLike]: `%${judul}%` }   
            };
        };

        let whereByUserId;
        if (user_id !== '') {
            whereByUserId = {
                reported_by: user_id
            };
        };

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            };
        };

        let whereByStatus;
        if (status !== '') {
            whereByStatus = {
                status
            };
        };

        let whereByKategori;
        if (kategori_id !== '') {
            whereByKategori = {
                kategori_id
            }
        }

        let whereByLevel;
        if (level_id !== '') {
            whereByLevel = {
                level_id
            }
        }

        let whereByDate;
        if (!isEmpty(startDate) || !isEmpty(endDate)) {
            whereByDate = {
                [Op.and]: [
                    { createdAt: { [Op.gte]: moment(startDate).format() } },
                    { createdAt: { [Op.lte]: moment(endDate).format() } }
                ]
            };
        };

        const where = {
            ...whereByNoTiket,
            ...whereByUsernameReported,
            ...whereByNamaLengkapReported,
            ...whereByJudul,
            ...whereByUserId,
            ...whereByPegawai,
            ...whereByStatus,
            ...whereByKategori,
            ...whereByLevel,
            ...whereByDate
        };

        let searchOrder;
        if (urutan) {
            searchOrder = [['updatedAt', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Tiket.count({}),
            Tiket.count({ 
            include: [
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap'],
                    duplicating: false
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap'],
                    duplicating: false
                }
            ],
            where 
            }),
            Tiket.findAll({
                attributes: [
                    'id',
                    'no_tiket',
                    'judul',
                    'detail',
                    'status',
                    'progress',
                    'created_by',
                    'reported_by',
                    'handled_by',
                    ['createdAt', 'tanggal_tiket'],
                    'tanggal_proses',
                    'tanggal_selesai',
                    'kategori_id',
                    'level_id',
                    'alasan',
                    'updatedAt'
                ],  
                include: [
                    {
                        model: Gambar,
                        as: 'files',
                        attributes: ['filename', 'destination']
                    },
                    {
                        model: Users,
                        as: 'created',
                        attributes: ['username', 'nama_lengkap'],
                        duplicating: false
                    },
                    {
                        model: Users,
                        as: 'reported',
                        attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                        required: true,
                        duplicating: false
                    },
                    {
                        model: Pegawai,
                        attributes: ['user_id', 'departemen_id', 'jabatan_id'],
                        as: 'handled',
                        include: [
                            {
                                model: Users,
                                attributes: [
                                    'nip', 
                                    'username', 
                                    'nama_lengkap', 
                                    'email', 
                                    'telepon', 
                                    'alamat'
                                ],
                                as: 'user',
                                duplicating: false
                            },
                            {
                                model: Departemen,
                                attributes: ['nama'],
                                as: 'departemen'
                            },
                            {
                                model: Jabatan,
                                attributes: ['nama_jabatan'],
                                as: 'jabatan'
                            },
                            { 
                                model: Teknisi,
                                attributes: ['id'],
                                as: 'teknisi',
                                include: {
                                    model: Kategori,
                                    as: 'kategori',
                                    attributes: ['kategori']
                                }
                            }
                        ]
                    },
                    {
                        model: Level,
                        as: 'level',
                        attributes: ['level', 'deskripsi']
                    },
                    {
                        model: Kategori,
                        as: 'kategori',
                        attributes: ['kategori']
                    },
                    {
                        model: Tracking,
                        as: 'tracking', 
                        attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                        include: {
                            model: Users,
                            as: 'user',
                            attributes: ['username', 'nama_lengkap']
                        }
                    },
                    {
                        model: Komentar,
                        as: 'komentar',
                        attributes: ['tiket_id', 'user_id', 'komentar'],
                        include: {
                            model: Users,
                            attributes: ['nama_lengkap'],
                            as: 'user',
                            include: [
                                {
                                    model: Kewenangan,
                                    attributes: ['kewenangan'],
                                    as: 'kewenangan'
                                },
                                {
                                    model: Gambar,
                                    attributes: ['destination', 'filename'],
                                    as: 'files'
                                }
                            ]
                        }
                    }
                ],
                where,
                order: searchOrder,
                offset: start,
                limit: length,
                nest: true
            })
        ]);

        return {
            draw,
            recordsTotal,
            recordsFiltered,
            data
        };
    } catch (error) {
        return error;
    }
}

async function GetDatatablesNotOpen (tiketData) {
    const { 
        draw, 
        order, 
        start, 
        length, 
        search,
        username, 
        nama_lengkap,
        no_tiket,
        judul,
        kategori_id,
        level_id,
        pegawai_id,
        user_id,
        startDate,
        endDate,
        urutan
    } = tiketData;
    log('[Tiket] GetDatatablesNotOpen', tiketData);
    try {
        let whereByStatus = {
            status: { [Op.ne]: 0 }
        };
        
        let whereByNoTiket;
        if (no_tiket !== '') {
            whereByNoTiket = {
                no_tiket: { [Op.iLike]: `%${no_tiket}%` }   
            };
        };

        let whereByUsernameReported;
        if (username !== '') {
            whereByUsernameReported = {
                '$reported.username$': { [Op.iLike]: `%${username}%` }   
            }
        };

        let whereByNamaLengkapReported;
        if (nama_lengkap !== '') {
            whereByNamaLengkapReported = {
                '$reported.nama_lengkap$': { [Op.iLike]: `%${nama_lengkap}%` }   
            };
        };

        let whereByJudul;
        if (judul !== '') {
            whereByJudul = {
                judul: { [Op.iLike]: `%${judul}%` }   
            };
        };

        let whereByUserId;
        if (user_id !== '') {
            whereByUserId = {
                reported_by: user_id
            };
        };

        let whereByPegawai;
        if (pegawai_id !== '') {
            whereByPegawai = {
                handled_by: pegawai_id
            };
        };

        let whereByKategori;
        if (kategori_id !== '') {
            whereByKategori = {
                kategori_id
            }
        }

        let whereByLevel;
        if (level_id !== '') {
            whereByLevel = {
                level_id
            }
        }

        let whereByDate;
        if (!isEmpty(startDate) || !isEmpty(endDate)) {
            whereByDate = {
                [Op.and]: [
                    { createdAt: { [Op.gte]: moment(startDate).format() } },
                    { createdAt: { [Op.lte]: moment(endDate).format() } }
                ]
            };
        };

        const where = {
            ...whereByNoTiket,
            ...whereByUsernameReported,
            ...whereByNamaLengkapReported,
            ...whereByJudul,
            ...whereByUserId,
            ...whereByPegawai,
            ...whereByStatus,
            ...whereByKategori,
            ...whereByLevel,
            ...whereByDate
        };

        let searchOrder;
        if (urutan) {
            searchOrder = [['updatedAt', urutan]];
        };

        const [recordsTotal, recordsFiltered, data] = await Promise.all([
            Tiket.count({}),
            Tiket.count({ 
            include: [
                {
                    model: Users,
                    as: 'created',
                    attributes: ['username', 'nama_lengkap'],
                    duplicating: false
                },
                {
                    model: Users,
                    as: 'reported',
                    attributes: ['username', 'nama_lengkap'],
                    duplicating: false
                }
            ],
            where 
            }),
            Tiket.findAll({
                attributes: [
                    'id',
                    'no_tiket',
                    'judul',
                    'detail',
                    'status',
                    'progress',
                    'created_by',
                    'reported_by',
                    'handled_by',
                    ['createdAt', 'tanggal_tiket'],
                    'tanggal_proses',
                    'tanggal_selesai',
                    'kategori_id',
                    'level_id',
                    'alasan',
                    'updatedAt'
                ],  
                include: [
                    {
                        model: Gambar,
                        as: 'files',
                        attributes: ['filename', 'destination']
                    },
                    {
                        model: Users,
                        as: 'created',
                        attributes: ['username', 'nama_lengkap'],
                        duplicating: false
                    },
                    {
                        model: Users,
                        as: 'reported',
                        attributes: ['username', 'nama_lengkap', 'nip', 'email', 'telepon'],
                        required: true,
                        duplicating: false
                    },
                    {
                        model: Pegawai,
                        attributes: ['user_id', 'departemen_id', 'jabatan_id'],
                        as: 'handled',
                        include: [
                            {
                                model: Users,
                                attributes: [
                                    'nip', 
                                    'username', 
                                    'nama_lengkap', 
                                    'email', 
                                    'telepon', 
                                    'alamat'
                                ],
                                as: 'user',
                                duplicating: false
                            },
                            {
                                model: Departemen,
                                attributes: ['nama'],
                                as: 'departemen'
                            },
                            {
                                model: Jabatan,
                                attributes: ['nama_jabatan'],
                                as: 'jabatan'
                            },
                            { 
                                model: Teknisi,
                                attributes: ['id'],
                                as: 'teknisi',
                                include: {
                                    model: Kategori,
                                    as: 'kategori',
                                    attributes: ['kategori']
                                }
                            }
                        ]
                    },
                    {
                        model: Level,
                        as: 'level',
                        attributes: ['level', 'deskripsi']
                    },
                    {
                        model: Kategori,
                        as: 'kategori',
                        attributes: ['kategori']
                    },
                    {
                        model: Tracking,
                        as: 'tracking', 
                        attributes: ['id', 'tiket_id', 'status', 'deskripsi', 'createdAt'],
                        include: {
                            model: Users,
                            as: 'user',
                            attributes: ['username', 'nama_lengkap']
                        }
                    },
                    {
                        model: Komentar,
                        as: 'komentar',
                        attributes: ['tiket_id', 'user_id', 'komentar']
                    }
                ],
                where,
                order: searchOrder,
                offset: start,
                limit: length,
                nest: true
            })
        ]);

        return {
            draw,
            recordsTotal,
            recordsFiltered,
            data
        };
    } catch (error) {
        return error;
    }
}

module.exports = {
    Create,
    Update,
    ApprovedIn,
    Approved,
    Assign,
    Solved,
    Pending,
    ForwardTo,
    GetById,
    GetByTiket,
    GetDatatables,
    GetDatatablesNotOpen,
    GetByEmployee
}