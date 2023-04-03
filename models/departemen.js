// Departemen Schema
module.exports = (sequelize, DataTypes) => {
    const Departemen = sequelize.define('Departemen',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            nama: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        },
        { freezeTableName: true }
    );
    
    return Departemen;
};