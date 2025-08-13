
// Complete Reset Script - Copy to Console
(function() {
    console.log('=== Complete Configuration Reset ===');
    
    // Step 1: Clear all localStorage
    console.log('1. Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Step 2: Clear specific items
    console.log('2. Clearing specific items...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('config');
    console.log('✅ Specific items cleared');
    
    // Step 3: Force reload
    console.log('3. Force reloading...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
})();
