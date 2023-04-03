// Gambar Schema
module.exports = (sequelize, DataTypes) => {
    const Gambar = sequelize.define('Gambar',
        {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            originalname: DataTypes.STRING,
            encoding: DataTypes.STRING,
            mimetype: DataTypes.STRING,
            destination: DataTypes.STRING,
            filename: DataTypes.STRING,
            path: DataTypes.STRING,
            size: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        },
        { freezeTableName: true }
    );
    
    Gambar.associate = function (models) {
        Gambar.hasOne(models.Users, {
            foreignKey: 'gambar_id',
            as: 'files'
        });
        models.Users.belongsTo(Gambar, {
            foreignKey: 'gambar_id',
            as: 'files'
        });
    }
    
    return Gambar;
};