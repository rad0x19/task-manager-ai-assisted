/**
 * Script to create an administrator account
 * 
 * Usage:
 *   node scripts/create-admin.js <email> <password> <name>
 * 
 * Example:
 *   node scripts/create-admin.js admin@example.com SecurePassword123 "Admin User"
 * 
 * Or run in Docker:
 *   docker-compose exec web node scripts/create-admin.js admin@example.com SecurePassword123 "Admin User"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin(email, password, name) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role === 'ADMIN') {
        console.log('✓ User already exists and is an ADMIN');
        return existingUser;
      }
      
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      console.log('✓ Updated existing user to ADMIN role');
      return updatedUser;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'ADMIN',
      },
    });

    // Create default personal workspace
    await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        type: 'PERSONAL',
        ownerId: adminUser.id,
        members: {
          create: {
            userId: adminUser.id,
            role: 'OWNER',
          },
        },
      },
    });

    console.log('✓ Admin user created successfully!');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Name: ${adminUser.name}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log(`  ID: ${adminUser.id}`);

    return adminUser;
  } catch (error) {
    console.error('✗ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const [,, email, password, name] = process.argv;

if (!email || !password || !name) {
  console.error('Usage: node scripts/create-admin.js <email> <password> <name>');
  console.error('Example: node scripts/create-admin.js admin@example.com SecurePassword123 "Admin User"');
  process.exit(1);
}

createAdmin(email, password, name)
  .then(() => {
    console.log('\n✓ Done! You can now log in with the admin credentials.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Failed to create admin user');
    process.exit(1);
  });
