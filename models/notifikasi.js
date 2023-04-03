// Notifikasi schema
module.exports = (sequelize, DataTypes) => {
    const Notifikasi = sequelize.define('Notifikasi',
        {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            tiket_id: DataTypes.UUID,
            user_id: DataTypes.UUID,
            pegawai_id: DataTypes.UUID,
            title: DataTypes.STRING,
            detail: DataTypes.TEXT,
            read_admin: DataTypes.BOOLEAN,
            read_pegawai: DataTypes.BOOLEAN,
            read_user: DataTypes.BOOLEAN
        },
        { freezeTableName: true }
    );

    Notifikasi.associate = function (models) {
        Notifikasi.belongsTo(models.Tiket, {
            foreignKey: 'tiket_id',
            as: 'tiket'
        });
        models.Tiket.hasMany(Notifikasi, {
            foreignKey: 'tiket_id',
            as: 'notifikasi'
        });

        Notifikasi.belongsTo(models.Pegawai, {
            foreignKey: 'pegawai_id',
            as: 'pegawai'
        });
        models.Pegawai.hasOne(Notifikasi, {
            foreignKey: 'pegawai_id',
            as: 'notifikasi'
        });

        Notifikasi.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user'
        });
        models.Users.hasMany(Notifikasi, {
            foreignKey: 'user_id',
            as: 'notifikasi'
        });
    }
    
    return Notifikasi;
};