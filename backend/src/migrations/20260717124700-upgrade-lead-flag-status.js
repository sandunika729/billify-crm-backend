'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old boolean column
    await queryInterface.removeColumn('crm_leads', 'is_flagged');

    // Add the new ENUM column
    await queryInterface.addColumn('crm_leads', 'flag_status', {
      type: Sequelize.ENUM('none', 'flagged', 'completed'),
      allowNull: false,
      defaultValue: 'none',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert ENUM column
    await queryInterface.removeColumn('crm_leads', 'flag_status');

    // Note: We'd need to drop the ENUM type in Postgres, but Sequelize handles it natively in some dialects.
    // Re-add boolean column
    await queryInterface.addColumn('crm_leads', 'is_flagged', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }
};
