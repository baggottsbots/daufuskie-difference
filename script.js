// ===== EMAIL SIGNUP FORM HANDLER =====
    // Purpose: Capture email and show confirmation message
    // Triggers: Form submission
    document.getElementById('signup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Hide form, show success message
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('success-message').classList.remove('hidden');
    });