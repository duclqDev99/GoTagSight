
// Force Reset Configuration Script - Copy to Console
(function() {
    console.log('=== Force Reset Configuration ===');
    
    // Step 1: Clear localStorage completely
    console.log('1. Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Step 2: Force reload to reset main process
    console.log('2. Force reloading application...');
    window.location.reload();
})();
