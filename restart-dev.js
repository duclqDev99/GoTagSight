const { exec } = require('child_process');

console.log('=== Restart Development Server ===\n');

console.log('1. Stopping current development server...');
console.log('   Press Ctrl+C in the terminal where npm run dev is running');
console.log('   Or close the terminal and run this script');

console.log('\n2. After stopping the server, run:');
console.log('   npm run dev');

console.log('\n3. Then use the fix-token-final.js script to update the token');

console.log('\n=== Alternative: Quick Restart ===');
console.log('If you want to restart quickly:');
console.log('1. Stop the current server (Ctrl+C)');
console.log('2. Run: npm run build:main');
console.log('3. Run: npm run dev');
console.log('4. Use fix-token-final.js script');

console.log('\n=== Manual Steps ===');
console.log('1. Stop development server (Ctrl+C)');
console.log('2. Clear any cached data');
console.log('3. Restart: npm run dev');
console.log('4. Open application');
console.log('5. Open Developer Tools (F12)');
console.log('6. Copy fix-token-final.js content to Console');
console.log('7. Test "Add to Inventory" function'); 