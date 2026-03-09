const { User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✓ Database connected');

        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123';
        const fullName = 'System Admin';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log('⚠ Admin user already exists:', adminEmail);
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        // Create admin user
        const admin = await User.create({
            full_name: fullName,
            email: adminEmail,
            password_hash: passwordHash,
            role: 'admin',
        });

        console.log('✓ Admin user created successfully');
        console.log('-----------------------------------');
        console.log('Full Name: ', admin.full_name);
        console.log('Email:     ', admin.email);
        console.log('Password:  ', adminPassword);
        console.log('Role:      ', admin.role);
        console.log('-----------------------------------');

    } catch (error) {
        console.error('✗ Failed to create admin user:', error);
    } finally {
        await sequelize.close();
    }
};

createAdmin();
