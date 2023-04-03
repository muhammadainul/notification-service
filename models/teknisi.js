// Teknisi Schema
module.exports = (sequelize, DataTypes) => {
    const Teknisi = sequelize.define('Teknisi',
        {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            pegawai_id: DataTypes.UUID,
            kategori_id: DataTypes.INTEGER,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        },
        { freezeTableName: true }
    );

    Teknisi.associate = function (models) {
        Teknisi.belongsTo(models.Pegawai, {
            foreignKey: 'pegawai_id',
            as: 'pegawai'
        });
        models.Pegawai.hasOne(Teknisi, {
            foreignKey: 'pegawai_id',
            as: 'teknisi'
        })
        // Teknisi.belongsTo(models.Kategori, {
        //     foreignKey: 'kategori_id',
        //     as: 'kategori'
        // });
    }
    
    return Teknisi;
};