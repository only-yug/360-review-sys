'use strict';
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Ensure our .env file is read

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const fullName = process.env.ADMIN_FULL_NAME || 'System Admin';

    // Check if admin already exists
    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = '${adminEmail}'`
    );

    if (existingUsers && existingUsers.length > 0) {
      console.log(`\n⚠  [Seed] Admin user already exists with email: ${adminEmail}. Skipping creation.\n`);
      return; 
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create the admin user natively via seeder
    await queryInterface.bulkInsert('users', [{
      full_name: fullName,
      email: adminEmail,
      password_hash: passwordHash,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    console.log('\n✓  [Seed] Admin user created successfully via Migration/Seed');
    console.log('-----------------------------------');
    console.log('Full Name: ', fullName);
    console.log('Email:     ', adminEmail);
    console.log('Password:  *** (Set from ENV) ***');
    console.log('Role:      admin');
    console.log('-----------------------------------\n');
  },

  down: async (queryInterface, Sequelize) => {
    require('dotenv').config();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await queryInterface.bulkDelete('users', { email: adminEmail }, {});
  }
};
