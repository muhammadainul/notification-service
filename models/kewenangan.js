// Kewenangan schema
module.exports = (sequelize, DataTypes) => {
    const Kewenangan = sequelize.define('Kewenangan',
        {
            kewenangan: DataTypes.STRING
        },
        { freezeTableName: true }
    );
    
    Kewenangan.associate = function (models) {
        Kewenangan.hasOne(models.Users, {
            foreignKey: 'kewenangan_id',
            as: 'user'
        });
        models.Users.belongsTo(Kewenangan, {
            foreignKey: 'kewenangan_id',
            as: 'kewenangan'
        })
    }
    
    return Kewenangan;  
};