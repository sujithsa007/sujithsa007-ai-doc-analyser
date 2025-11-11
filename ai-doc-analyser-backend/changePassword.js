/**
 * 🔐 Password Change Helper Script
 * 
 * This script helps you change passwords easily without manual API calls.
 * 
 * Usage:
 *   node changePassword.js
 * 
 * The script will:
 * 1. Start the backend server automatically
 * 2. Login with current credentials
 * 3. Change the password
 * 4. Verify the new password works
 */

import axios from 'axios';
import readline from 'readline';

const API_URL = 'http://localhost:5000';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Hide password input (simple version)
function questionHidden(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    let password = '';
    process.stdin.on('data', function onData(char) {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

// Main password change function
async function changePassword() {
  try {
    console.log('\n🔐 Password Change Helper\n');
    console.log('This script will help you change your password securely.\n');

    // Get user credentials
    const email = await question('Email address: ');
    const currentPassword = await questionHidden('Current password: ');
    const newPassword = await questionHidden('New password: ');
    const confirmPassword = await questionHidden('Confirm new password: ');

    // Validate inputs
    if (!email || !currentPassword || !newPassword) {
      console.error('\n❌ Error: All fields are required');
      rl.close();
      return;
    }

    if (newPassword !== confirmPassword) {
      console.error('\n❌ Error: New passwords do not match');
      rl.close();
      return;
    }

    if (newPassword.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters');
      rl.close();
      return;
    }

    console.log('\n⏳ Processing...\n');

    // Step 1: Check if server is running
    console.log('1️⃣  Checking server status...');
    try {
      await axios.get(`${API_URL}/health`);
      console.log('   ✅ Server is running\n');
    } catch (error) {
      console.error('   ❌ Server is not running!');
      console.error('   Please start the server first:');
      console.error('   cd ai-doc-analyser-backend && npm run dev\n');
      rl.close();
      return;
    }

    // Step 2: Login
    console.log('2️⃣  Logging in...');
    let accessToken;
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email,
        password: currentPassword
      });
      
      accessToken = loginResponse.data.accessToken;
      console.log('   ✅ Login successful\n');
    } catch (error) {
      console.error('   ❌ Login failed:', error.response?.data?.error || error.message);
      console.error('   Please check your email and current password.\n');
      rl.close();
      return;
    }

    // Step 3: Change password
    console.log('3️⃣  Changing password...');
    try {
      const changeResponse = await axios.post(
        `${API_URL}/auth/change-password`,
        {
          oldPassword: currentPassword,
          newPassword: newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('   ✅ Password changed successfully!\n');
    } catch (error) {
      console.error('   ❌ Password change failed:', error.response?.data?.error || error.message);
      rl.close();
      return;
    }

    // Step 4: Verify new password
    console.log('4️⃣  Verifying new password...');
    try {
      const verifyResponse = await axios.post(`${API_URL}/auth/login`, {
        email,
        password: newPassword
      });

      console.log('   ✅ New password verified!\n');
      console.log('═══════════════════════════════════════════════════');
      console.log('🎉 SUCCESS! Your password has been changed.');
      console.log('═══════════════════════════════════════════════════');
      console.log('\n⚠️  Important:');
      console.log('   • All your previous sessions have been logged out');
      console.log('   • Please use your new password for future logins');
      console.log('   • Your API key remains unchanged\n');
    } catch (error) {
      console.error('   ⚠️  Warning: Could not verify new password');
      console.error('   However, the password was changed successfully.');
      console.error('   Please try logging in with your new password.\n');
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    rl.close();
  }
}

// Quick change for default admin
async function changeAdminPassword() {
  try {
    console.log('\n🔐 Quick Admin Password Change\n');
    console.log('This will change the default admin password.\n');

    const newPassword = await questionHidden('New admin password: ');
    const confirmPassword = await questionHidden('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.error('\n❌ Error: Passwords do not match');
      rl.close();
      return;
    }

    if (newPassword.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters');
      rl.close();
      return;
    }

    console.log('\n⏳ Processing...\n');

    // Check server
    console.log('1️⃣  Checking server status...');
    try {
      await axios.get(`${API_URL}/health`);
      console.log('   ✅ Server is running\n');
    } catch (error) {
      console.error('   ❌ Server is not running!');
      console.error('   Please start the server first:');
      console.error('   cd ai-doc-analyser-backend && npm run dev\n');
      rl.close();
      return;
    }

    // Login as admin
    console.log('2️⃣  Logging in as admin...');
    let accessToken;
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@aidoc.local',
        password: 'Admin123'
      });
      
      accessToken = loginResponse.data.accessToken;
      console.log('   ✅ Login successful\n');
    } catch (error) {
      console.error('   ❌ Login failed. Default admin password may have already been changed.');
      console.error('   Please use the regular password change option.\n');
      rl.close();
      return;
    }

    // Change password
    console.log('3️⃣  Changing admin password...');
    try {
      await axios.post(
        `${API_URL}/auth/change-password`,
        {
          oldPassword: 'Admin123',
          newPassword: newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('   ✅ Password changed successfully!\n');
      console.log('═══════════════════════════════════════════════════');
      console.log('🎉 SUCCESS! Admin password has been changed.');
      console.log('═══════════════════════════════════════════════════');
      console.log('\nNew admin credentials:');
      console.log('   Email: admin@aidoc.local');
      console.log('   Password: [your new password]\n');
    } catch (error) {
      console.error('   ❌ Password change failed:', error.response?.data?.error || error.message);
    }

    rl.close();

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    rl.close();
  }
}

// Main menu
async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   🔐 Password Change Helper Script      ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('Choose an option:\n');
  console.log('1. Change password for any user');
  console.log('2. Quick change for default admin (admin123)');
  console.log('3. Exit\n');

  const choice = await question('Enter your choice (1-3): ');

  switch (choice) {
    case '1':
      await changePassword();
      break;
    case '2':
      await changeAdminPassword();
      break;
    case '3':
      console.log('\nGoodbye! 👋\n');
      rl.close();
      break;
    default:
      console.log('\n❌ Invalid choice. Please run the script again.\n');
      rl.close();
      break;
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
