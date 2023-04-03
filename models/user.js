// USER schema
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('Users', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        username: DataTypes.STRING,
        password: DataTypes.STRING,
        enabled: DataTypes.BOOLEAN,
        nip: DataTypes.STRING,
        nama_lengkap: DataTypes.STRING,
        email: DataTypes.STRING,
        telepon: DataTypes.STRING,
        alamat: DataTypes.TEXT,
        gambar_id: {
            type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'gambar',
				key: 'id'
			}
        },
        kewenangan_id: DataTypes.INTEGER,
        consumer_id: DataTypes.STRING
    },
    {}
    );

    User.accociate = function (models) {
        User.hasMany(models.Logs, {
            foreignKey: 'user_id'
        });
    };
    
    return User;
}