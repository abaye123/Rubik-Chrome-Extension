document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const signatureToggle = document.getElementById('signatureToggle');
    const signatureText = document.getElementById('signatureText');
    const greetingToggle = document.getElementById('greetingToggle');
    const addBeha = document.getElementById('addBeha');
    const greetingPreview = document.getElementById('greetingPreview');
    const saveButton = document.getElementById('saveSignature');
    
    // Load saved settings
    loadSettings();
    
    // Update greeting preview based on current time
    updateGreetingPreview();
    
    // Event listeners
    signatureToggle.addEventListener('change', function() {
        // Enable/disable textarea based on toggle
        signatureText.disabled = !signatureToggle.checked;
        if (!signatureToggle.checked) {
            signatureText.classList.add('disabled');
        } else {
            signatureText.classList.remove('disabled');
        }
    });
    
    greetingToggle.addEventListener('change', function() {
        // Enable/disable greeting options based on toggle
        const options = document.querySelector('.greeting-options');
        if (!greetingToggle.checked) {
            options.classList.add('disabled');
        } else {
            options.classList.remove('disabled');
        }
        
        // Update preview
        updateGreetingPreview();
    });
    
    addBeha.addEventListener('change', function() {
        // Update preview when "ב"ה" option changes
        updateGreetingPreview();
    });
    
    saveButton.addEventListener('click', function() {
        // Save all settings
        chrome.storage.sync.set({
            'signatureEnabled': signatureToggle.checked,
            'signatureText': signatureText.value,
            'greetingEnabled': greetingToggle.checked,
            'addBeha': addBeha.checked
        }, function() {
            // Show saved animation
            saveButton.classList.add('saved');
            saveButton.textContent = 'נשמר!';
            
            // Reset button after animation
            setTimeout(function() {
                saveButton.classList.remove('saved');
                saveButton.textContent = 'שמור הגדרות';
            }, 2000);
            
            // Send message to content script to update settings
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0].url.includes('mail.google.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateSettings',
                        signature: {
                            enabled: signatureToggle.checked,
                            text: signatureText.value
                        },
                        greeting: {
                            enabled: greetingToggle.checked,
                            addBeha: addBeha.checked
                        }
                    });
                }
            });
        });
    });
    
    // Add animation to sections
    animateSections();
});

// Load saved settings from storage
function loadSettings() {
    const signatureToggle = document.getElementById('signatureToggle');
    const signatureText = document.getElementById('signatureText');
    const greetingToggle = document.getElementById('greetingToggle');
    const addBeha = document.getElementById('addBeha');
    
    chrome.storage.sync.get([
        'signatureEnabled', 
        'signatureText', 
        'greetingEnabled', 
        'addBeha'
    ], function(result) {
        // Set signature toggle state
        if (result.signatureEnabled !== undefined) {
            signatureToggle.checked = result.signatureEnabled;
            signatureText.disabled = !result.signatureEnabled;
            
            if (!result.signatureEnabled) {
                signatureText.classList.add('disabled');
            }
        }
        
        // Set signature text
        if (result.signatureText !== undefined) {
            signatureText.value = result.signatureText;
        }
        
        // Set greeting toggle state
        if (result.greetingEnabled !== undefined) {
            greetingToggle.checked = result.greetingEnabled;
            
            const options = document.querySelector('.greeting-options');
            if (!result.greetingEnabled) {
                options.classList.add('disabled');
            }
        }
        
        // Set "ב"ה" checkbox state
        if (result.addBeha !== undefined) {
            addBeha.checked = result.addBeha;
        }
        
        // Update greeting preview
        updateGreetingPreview();
    });
}

// Update greeting preview based on current time
function updateGreetingPreview() {
    const greetingPreview = document.getElementById('greetingPreview');
    const addBeha = document.getElementById('addBeha');
    const greetingToggle = document.getElementById('greetingToggle');
    
    if (!greetingToggle.checked) {
        greetingPreview.innerHTML = '<span class="disabled-text">הברכה האוטומטית מושבתת</span>';
        return;
    }
    
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'בוקר טוב,';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'צהריים טובים,';
    } else if (hour >= 17 && hour < 21) {
        greeting = 'ערב טוב,';
    } else {
        greeting = 'לילה טוב,';
    }
    
    if (addBeha.checked) {
        greetingPreview.innerHTML = `ב"ה<br><br>${greeting}`;
    } else {
        greetingPreview.innerHTML = greeting;
    }
}

// Add animations to sections
function animateSections() {
    const sections = document.querySelectorAll('.about-section, .features-section, .signature-section');
    
    // Add staggered animation
    sections.forEach((section, index) => {
        section.style.animationDelay = `${0.1 + (index * 0.1)}s`;
    });
    
    // Add hover effect to feature items
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach((item, index) => {
        item.style.animationDelay = `${0.5 + (index * 0.2)}s`;
    });
}

// Add visual feedback when hovering over buttons and interactive elements
document.addEventListener('mouseover', function(event) {
    if (event.target.classList.contains('save-button') || 
        event.target.classList.contains('slider') ||
        event.target.classList.contains('highlight')) {
        
        // Add subtle scale effect
        event.target.style.transform = 'scale(1.05)';
    }
});

document.addEventListener('mouseout', function(event) {
    if (event.target.classList.contains('save-button') || 
        event.target.classList.contains('slider') ||
        event.target.classList.contains('highlight')) {
        
        // Reset scale
        event.target.style.transform = '';
    }
});
