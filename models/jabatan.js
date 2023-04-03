// Jabatan Schema
module.exports = (sequelize, DataTypes) => {
    const Jabatan = sequelize.define('Jabatan',
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            nama_jabatan: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE
        },
        { freezeTableName: true }
    );
    
    return Jabatan;
};