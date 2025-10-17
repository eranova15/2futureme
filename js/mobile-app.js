// 2FutureMe - Enhanced Mobile App
class FutureMeApp {
    constructor() {
        this.currentScreen = 'welcome';
        this.message = '';
        this.deliveryDate = null;
        this.selectedDeliveryOptions = [];
        this.vault = this.loadVault();
        this.isInFocusMode = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDeliveryDate();
        this.showScreen('welcome');
        this.loadGoogleFonts();
    }

    loadGoogleFonts() {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    bindEvents() {
        // Welcome screen buttons
        document.getElementById('startBtn')?.addEventListener('click', () => this.showScreen('inspiration'));
        document.getElementById('vaultBtn')?.addEventListener('click', () => this.showScreen('vault'));

        // Inspiration screen
        document.getElementById('readyBtn')?.addEventListener('click', () => this.showScreen('writing'));

        // Writing screen
        document.getElementById('reviewBtn')?.addEventListener('click', () => this.showScreen('review'));
        document.getElementById('focusModeBtn')?.addEventListener('click', () => this.enterFocusMode());
        
        // Message input
        const messageInput = document.getElementById('messageTextarea');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => this.updateCharCount(e.target.value));
            messageInput.addEventListener('input', (e) => this.message = e.target.value);
        }

        // Focus mode
        document.getElementById('exitFocusBtn')?.addEventListener('click', () => this.exitFocusMode());
        const focusTextarea = document.getElementById('focusTextarea');
        if (focusTextarea) {
            focusTextarea.addEventListener('input', (e) => this.updateFocusCharCount(e.target.value));
            focusTextarea.addEventListener('input', (e) => {
                this.message = e.target.value;
                document.getElementById('messageTextarea').value = e.target.value;
            });
        }

        // Review screen
        document.getElementById('editBtn')?.addEventListener('click', () => this.showScreen('writing'));
        document.getElementById('sendBtn')?.addEventListener('click', () => this.showDeliveryPopup());

        // Delivery popup
        document.getElementById('confirmDeliveryBtn')?.addEventListener('click', () => this.processDelivery());
        document.getElementById('cancelDeliveryBtn')?.addEventListener('click', () => this.hideDeliveryPopup());
        
        // Delivery options
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.addEventListener('click', () => this.selectDeliveryOption(option));
        });

        // Success screen
        document.getElementById('writeAnotherBtn')?.addEventListener('click', () => this.startNewLetter());
        document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.showScreen('welcome'));

        // Close popup when clicking overlay
        document.getElementById('deliveryPopup')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-overlay')) {
                this.hideDeliveryPopup();
            }
        });

        // Handle device back button
        window.addEventListener('popstate', (e) => {
            if (this.isInFocusMode) {
                this.exitFocusMode();
            } else if (this.currentScreen !== 'welcome') {
                this.goBack();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isInFocusMode) {
                    this.exitFocusMode();
                } else if (document.getElementById('deliveryPopup').classList.contains('active')) {
                    this.hideDeliveryPopup();
                }
            }
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active', 'prev');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            // Update content based on screen
            if (screenId === 'review') {
                this.updateReviewContent();
            } else if (screenId === 'vault') {
                this.updateVaultContent();
            }

            // Handle focus for writing screen
            if (screenId === 'writing') {
                setTimeout(() => {
                    document.getElementById('messageTextarea')?.focus();
                }, 300);
            }
        }
    }

    goBack() {
        const backMap = {
            'inspiration': 'welcome',
            'writing': 'inspiration',
            'review': 'writing',
            'success': 'welcome',
            'vault': 'welcome'
        };

        const backScreen = backMap[this.currentScreen] || 'welcome';
        this.showScreen(backScreen);
    }

    updateDeliveryDate() {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setFullYear(today.getFullYear() + 1);
        
        this.deliveryDate = futureDate;
        
        // Update date displays
        const todayFormatted = this.formatDate(today);
        const futureFormatted = this.formatDate(futureDate);
        
        document.querySelectorAll('.today-date').forEach(el => el.textContent = todayFormatted);
        document.querySelectorAll('.future-date').forEach(el => el.textContent = futureFormatted);
        
        // Update focus mode date
        document.getElementById('focusDate').textContent = `Writing on ${todayFormatted} • Delivery ${futureFormatted}`;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateCharCount(text) {
        const count = text.length;
        const charCountEl = document.getElementById('charCount');
        if (charCountEl) {
            charCountEl.textContent = `${count} characters`;
        }
        
        // Update review button state
        const reviewBtn = document.getElementById('reviewBtn');
        if (reviewBtn) {
            reviewBtn.disabled = count < 10;
        }
    }

    updateFocusCharCount(text) {
        const count = text.length;
        const focusCharCountEl = document.getElementById('focusCharCount');
        if (focusCharCountEl) {
            focusCharCountEl.textContent = `${count} characters`;
        }
        this.updateCharCount(text);
    }

    enterFocusMode() {
        this.isInFocusMode = true;
        const focusOverlay = document.getElementById('focusOverlay');
        const focusTextarea = document.getElementById('focusTextarea');
        
        if (focusOverlay && focusTextarea) {
            // Copy current message to focus textarea
            focusTextarea.value = this.message;
            this.updateFocusCharCount(this.message);
            
            // Show focus overlay
            focusOverlay.classList.add('active');
            
            // Request fullscreen if supported
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    // Fullscreen failed, continue anyway
                });
            }
            
            // Focus on textarea
            setTimeout(() => focusTextarea.focus(), 100);
        }
    }

    exitFocusMode() {
        this.isInFocusMode = false;
        const focusOverlay = document.getElementById('focusOverlay');
        
        if (focusOverlay) {
            focusOverlay.classList.remove('active');
            
            // Exit fullscreen if in fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {
                    // Exit fullscreen failed, continue anyway
                });
            }
            
            // Focus back on main textarea
            setTimeout(() => document.getElementById('messageTextarea')?.focus(), 100);
        }
    }

    updateReviewContent() {
        const letterText = document.getElementById('letterText');
        const letterSent = document.getElementById('letterSent');
        const letterDelivery = document.getElementById('letterDelivery');
        
        if (letterText) letterText.textContent = this.message;
        if (letterSent) letterSent.textContent = `Sent: ${this.formatDate(new Date())}`;
        if (letterDelivery) letterDelivery.textContent = `Delivery: ${this.formatDate(this.deliveryDate)}`;
    }

    showDeliveryPopup() {
        const popup = document.getElementById('deliveryPopup');
        if (popup) {
            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideDeliveryPopup() {
        const popup = document.getElementById('deliveryPopup');
        if (popup) {
            popup.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    selectDeliveryOption(optionElement) {
        // Clear previous selections
        document.querySelectorAll('.delivery-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select this option
        optionElement.classList.add('selected');
        
        // Show/hide input fields based on selection
        const optionType = optionElement.dataset.option;
        const emailInput = document.getElementById('emailInput');
        const phoneInput = document.getElementById('phoneInput');
        const addressInputs = document.getElementById('addressInputs');
        
        // Hide all inputs first
        if (emailInput) emailInput.style.display = 'none';
        if (phoneInput) phoneInput.style.display = 'none';
        if (addressInputs) addressInputs.style.display = 'none';
        
        // Show relevant inputs
        switch(optionType) {
            case 'email':
                if (emailInput) emailInput.style.display = 'block';
                break;
            case 'sms':
                if (phoneInput) phoneInput.style.display = 'block';
                break;
            case 'letter':
                if (addressInputs) addressInputs.style.display = 'block';
                break;
        }
    }

    processDelivery() {
        const selectedOption = document.querySelector('.delivery-option.selected');
        if (!selectedOption) {
            alert('Please select a delivery option');
            return;
        }

        const optionType = selectedOption.dataset.option;
        let deliveryInfo = { type: optionType };

        // Collect delivery information
        switch(optionType) {
            case 'email':
                const email = document.getElementById('emailInputField')?.value;
                if (!email || !this.isValidEmail(email)) {
                    alert('Please enter a valid email address');
                    return;
                }
                deliveryInfo.email = email;
                break;
                
            case 'sms':
                const phone = document.getElementById('phoneInputField')?.value;
                if (!phone || phone.length < 10) {
                    alert('Please enter a valid phone number');
                    return;
                }
                deliveryInfo.phone = phone;
                break;
                
            case 'letter':
                const address = {
                    street: document.getElementById('streetInput')?.value,
                    city: document.getElementById('cityInput')?.value,
                    state: document.getElementById('stateInput')?.value,
                    zip: document.getElementById('zipInput')?.value
                };
                
                if (!address.street || !address.city || !address.state || !address.zip) {
                    alert('Please fill in all address fields');
                    return;
                }
                deliveryInfo.address = address;
                break;
        }

        // Save to vault
        this.saveToVault(deliveryInfo);
        
        // Hide popup and show success
        this.hideDeliveryPopup();
        this.showScreen('success');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    saveToVault(deliveryInfo) {
        const letter = {
            id: Date.now(),
            message: this.message,
            createdDate: new Date(),
            deliveryDate: this.deliveryDate,
            deliveryInfo: deliveryInfo,
            status: 'scheduled'
        };

        this.vault.push(letter);
        this.saveVault();
    }

    loadVault() {
        try {
            const saved = localStorage.getItem('futureme_vault');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading vault:', error);
            return [];
        }
    }

    saveVault() {
        try {
            localStorage.setItem('futureme_vault', JSON.stringify(this.vault));
        } catch (error) {
            console.error('Error saving vault:', error);
        }
    }

    updateVaultContent() {
        const totalLetters = document.getElementById('totalLetters');
        const pendingLetters = document.getElementById('pendingLetters');
        
        if (totalLetters) totalLetters.textContent = this.vault.length;
        if (pendingLetters) {
            const pending = this.vault.filter(letter => letter.status === 'scheduled').length;
            pendingLetters.textContent = pending;
        }
    }

    startNewLetter() {
        // Reset form
        this.message = '';
        document.getElementById('messageTextarea').value = '';
        document.getElementById('focusTextarea').value = '';
        this.updateCharCount('');
        
        // Clear delivery popup selections
        document.querySelectorAll('.delivery-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Hide all input fields
        document.getElementById('emailInput').style.display = 'none';
        document.getElementById('phoneInput').style.display = 'none';
        document.getElementById('addressInputs').style.display = 'none';
        
        // Clear input values
        document.querySelectorAll('.option-input, .address-input').forEach(input => {
            input.value = '';
        });
        
        // Go to writing screen
        this.showScreen('writing');
    }

    // Utility methods for better UX
    vibrate() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    showToast(message, duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 12px 24px;
            border-radius: var(--radius);
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.style.opacity = '1', 10);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.futureMeApp = new FutureMeApp();
});

// Handle service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Handle install prompt for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--primary);
            color: white;
            padding: 16px;
            text-align: center;
            z-index: 9999;
        ">
            <p style="margin: 0 0 8px 0; font-size: 14px;">Install 2FutureMe for the best experience</p>
            <button id="installBtn" style="
                background: white;
                color: var(--primary);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
                margin-right: 8px;
            ">Install</button>
            <button id="dismissBtn" style="
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
            ">Maybe Later</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    document.getElementById('installBtn').addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installBanner.remove();
        });
    });
    
    document.getElementById('dismissBtn').addEventListener('click', () => {
        installBanner.remove();
    });
});
