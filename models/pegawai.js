// Pegawai Schema
module.exports = (sequelize, DataTypes) => {
    const Pegawai = sequelize.define('Pegawai',
        {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            user_id: DataTypes.UUID,
            departemen: DataTypes.STRING,
            jabatan: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        },
        { freezeTableName: true }
    );

    Pegawai.associate = function (models) {
        Pegawai.belongsTo(models.Users, {
            foreignKey: 'user_id',
            as: 'user'
        });
    }
    
    return Pegawai;
};