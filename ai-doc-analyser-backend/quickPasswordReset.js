/**
 * ⚡ Quick Admin Password Reset
 * 
 * This script changes the admin password by modifying the seed function.
 * Run this BEFORE starting the server, or restart the server after running it.
 * 
 * Usage: node quickPasswordReset.js YourNewPassword123
 */

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const newPassword = args[0];

if (!newPassword) {
  console.error('\n❌ Usage: node quickPasswordReset.js <NewPassword>\n');
  console.error('Example: node quickPasswordReset.js Admin123\n');
  process.exit(1);
}

// Validate password
if (newPassword.length < 8) {
  console.error('\n❌ Password must be at least 8 characters\n');
  process.exit(1);
}

if (!/[A-Z]/.test(newPassword)) {
  console.error('\n❌ Password must contain at least one uppercase letter\n');
  process.exit(1);
}

if (!/[a-z]/.test(newPassword)) {
  console.error('\n❌ Password must contain at least one lowercase letter\n');
  process.exit(1);
}

if (!/[0-9]/.test(newPassword)) {
  console.error('\n❌ Password must contain at least one number\n');
  process.exit(1);
}

async function updateSeedPassword() {
  try {
    console.log('\n🔧 Updating default admin password...\n');

    // Path to userService.js
    const userServicePath = path.join(process.cwd(), 'services', 'userService.js');
    
    // Read the file
    let content = fs.readFileSync(userServicePath, 'utf8');

    // Find and replace the default password in the seed function
    const passwordPattern = /password:\s*['"]([^'"]+)['"]\s*,?\s*\/\/[^\n]*/;
    const match = content.match(passwordPattern);
    
    if (!match) {
      console.error('❌ Could not find password line in userService.js');
      console.log('\nYou can manually edit services/userService.js');
      console.log('Look for the seedDefaultUser function and update the password field.');
      process.exit(1);
    }

    const oldPassword = match[1];
    console.log(`✅ Found current password: ${oldPassword}`);
    
    // Replace the password
    content = content.replace(
      passwordPattern,
      `password: '${newPassword}', // Changed via quickPasswordReset.js`
    );

    // Also update the console.log line to show the actual password
    const consolePattern = /console\.log\(['"`]   Password:['"`][^)]*\);/;
    content = content.replace(
      consolePattern,
      `console.log('   Password:', defaultUser.password, '⚠️  CHANGE THIS!');`
    );

    // Write back to file
    fs.writeFileSync(userServicePath, content, 'utf8');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SUCCESS! Default admin password updated.');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nNew default admin credentials:');
    console.log('   Email: admin@aidoc.local');
    console.log('   Username: admin');
    console.log(`   Password: ${newPassword}`);
    console.log('\n⚠️  IMPORTANT: Restart the server for changes to take effect!');
    console.log('\nTo restart:');
    console.log('   1. Stop the current server (Ctrl+C)');
    console.log('   2. Run: npm run dev');
    console.log('   3. The new password will be used for the default admin\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateSeedPassword();
