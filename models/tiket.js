// TIKET schema
module.exports = (sequelize, DataTypes) => {
    const Tiket = sequelize.define('Tiket', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        no_tiket: DataTypes.STRING,
        created_by: {
            type: DataTypes.UUID,
            unique: true
        },
        reported_by: {
            type: DataTypes.UUID,
            unique: true
        },
        kategori_id: {
            type: DataTypes.INTEGER,
        },
        level_id: {
            type: DataTypes.INTEGER,
        },
        gambar_id: {
            type: DataTypes.UUID
        },
        telepon: DataTypes.STRING,
        email: DataTypes.STRING,
        judul: DataTypes.STRING,
        detail: DataTypes.STRING,
        alasan: DataTypes.TEXT,
        handled_by: {
            type: DataTypes.UUID
        },
        status: DataTypes.INTEGER,
        progress: DataTypes.DECIMAL,
        tanggal_proses: DataTypes.DATE,
        tanggal_selesai: DataTypes.DATE
    },
    { freezeTableName: true }
    );

    Tiket.associate = function (models) {
        Tiket.belongsTo(models.Users, { 
            foreignKey: 'created_by', 
            through: 'created_by',
            as: 'created'
        });
        // Tiket.belongsTo(models.Kategori, {
        //     foreignKey: 'kategori_id',
        //     as: 'kategori'
        // });
        // Tiket.belongsTo(models.Level, {
        //     foreignKey: 'level_id',
        //     as: 'level'
        // });
        Tiket.belongsTo(models.Users, { 
            foreignKey: 'reported_by', 
            through: 'reported_by',
            as: 'reported'
        });
        Tiket.belongsTo(models.Pegawai, { 
            foreignKey: 'handled_by', 
            as: 'handled'
        });
        // Tiket.hasMany(models.Tracking, {
        //     foreignKey: 'tiket_id',
        //     as: 'tracking'
        // });
        Tiket.belongsTo(models.Gambar, {
            foreignKey: 'gambar_id',
            as: 'files'
        });
    };
    
    return Tiket;
}