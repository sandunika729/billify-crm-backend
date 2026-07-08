const { sequelize } = require('./src/models');

async function addVisibilityColumn() {
  try {
    console.log('Adding visibility column to crm_activities table...');
    await sequelize.query('ALTER TABLE crm_activities ADD COLUMN visibility ENUM("public", "private") DEFAULT "public" NOT NULL;');
    console.log('Visibility column added successfully.');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('Column "visibility" already exists.');
    } else {
      console.error('Error adding column:', error);
    }
    process.exit(1);
  }
}

addVisibilityColumn();
