module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn(
                'Notifikasi',
                'read_admin',
                {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: false
                }
            ),
            queryInterface.addColumn(
                'Notifikasi',
                'read_pegawai',
                {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: false
                }
            ),
            queryInterface.addColumn(
                'Notifikasi',
                'read_user',
                {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: false
                }
            ),
        ])
    },
    down: async (queryInterface , Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn(
                'Notifikasi',
                'read'
            )
        ])
    }
}