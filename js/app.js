class App {
    constructor() {
        this.currentView = 'home';
        this.navigationHistory = [];
        this.currentLanguage = 'en-US';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupLanguageButtons();
        this.handleShortcutActions();
        this.showHome();
        console.log('2FutureMe app initialized');
    }

    setupEventListeners() {
        // Language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.changeLanguage(lang);
            });
        });

        // Make this available globally for voice commands
        window.app = this;
    }

    setupLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.dataset.lang === this.currentLanguage) {
                btn.classList.add('active');
            }
        });
    }

    handleShortcutActions() {
        // Handle PWA shortcut actions
        const shortcutAction = document.documentElement.getAttribute('data-shortcut-action');
        
        if (shortcutAction) {
            console.log('🚀 Handling shortcut action:', shortcutAction);
            
            // Wait for components to initialize
            setTimeout(() => {
                switch (shortcutAction) {
                    case 'voice':
                        this.startVoiceRecording();
                        break;
                    case 'photo':
                        this.startPhotoCapture();
                        break;
                    case 'vault':
                        this.showVault();
                        break;
                }
            }, 1000);
        }
    }

    startVoiceRecording() {
        const voiceCard = document.getElementById('voiceCard');
        if (voiceCard) {
            voiceCard.scrollIntoView({ behavior: 'smooth' });
            
            // Highlight the voice card
            voiceCard.classList.add('shortcut-highlight');
            setTimeout(() => voiceCard.classList.remove('shortcut-highlight'), 2000);
            
            // Start recording if available
            if (window.recorder) {
                setTimeout(() => window.recorder.start(), 500);
            }
        }
    }

    startPhotoCapture() {
        const photoCard = document.getElementById('photoCard');
        if (photoCard) {
            photoCard.scrollIntoView({ behavior: 'smooth' });
            
            // Highlight the photo card
            photoCard.classList.add('shortcut-highlight');
            setTimeout(() => photoCard.classList.remove('shortcut-highlight'), 2000);
            
            // Start camera if available
            if (window.camera) {
                setTimeout(() => window.camera.startCamera(), 500);
            }
        }
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        
        // Update language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });

        // Update voice recognition language
        if (window.voiceRecognition) {
            window.voiceRecognition.changeLanguage(lang);
        }
    }

    // Navigation methods for voice commands
    goBack() {
        if (this.navigationHistory.length > 0) {
            const previousView = this.navigationHistory.pop();
            this.currentView = previousView;
            this.renderView(previousView);
        } else {
            this.goHome();
        }
    }

    goHome() {
        this.currentView = 'home';
        this.navigationHistory = [];
        this.showHome();
        this.scrollToTop();
    }

    next() {
        // Navigate to next logical section
        switch (this.currentView) {
            case 'home':
                this.showVault();
                break;
            case 'vault':
                this.showHome();
                break;
            default:
                this.showVault();
        }
    }

    previous() {
        this.goBack();
    }

    showHome() {
        this.navigationHistory.push(this.currentView);
        this.currentView = 'home';
        
        // Scroll to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showVault() {
        this.navigationHistory.push(this.currentView);
        this.currentView = 'vault';
        
        // Scroll to vault section
        const vaultSection = document.querySelector('.vault-section');
        if (vaultSection) {
            vaultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    renderView(view) {
        switch (view) {
            case 'home':
                this.showHome();
                break;
            case 'vault':
                this.showVault();
                break;
            default:
                this.showHome();
        }
    }

    discardCurrentMessage() {
        if (window.vault) {
            window.vault.discardCurrentMessage();
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Check browser compatibility
    checkCompatibility() {
        const features = {
            speechRecognition: ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
            mediaRecorder: ('MediaRecorder' in window),
            getUserMedia: (navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            indexedDB: ('indexedDB' in window)
        };

        const missing = Object.keys(features).filter(feature => !features[feature]);
        
        if (missing.length > 0) {
            this.showNotification(
                `Some features may not work: ${missing.join(', ')}. Please use a modern browser like Chrome or Firefox.`,
                'error'
            );
        }

        return missing.length === 0;
    }

    // Help system
    showHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal';
        helpModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>How to Use 2FutureMe</h3>
                    <button class="close-modal" onclick="this.closest('.help-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="help-section">
                        <h4><i class="fas fa-microphone"></i> Voice Control</h4>
                        <p>Say "Start Listening" to activate voice commands. Then use commands like:</p>
                        <ul>
                            <li>"Start recording" - Begin voice message</li>
                            <li>"Stop recording" - End voice message</li>
                            <li>"Take photo" - Capture handwritten letter</li>
                            <li>"Save message" - Store in vault for 3 months</li>
                            <li>"Go back" / "Next" - Navigate</li>
                            <li>"Change language to Spanish" - Switch languages</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h4><i class="fas fa-archive"></i> Message Vault</h4>
                        <p>Messages are automatically scheduled for delivery 3 months after creation. You can:</p>
                        <ul>
                            <li>View ready messages immediately</li>
                            <li>See countdown for pending messages</li>
                            <li>Delete unwanted messages</li>
                            <li>Add notes to your future self</li>
                        </ul>
                    </div>

                    <div class="help-section">
                        <h4><i class="fas fa-language"></i> Multi-Language Support</h4>
                        <p>Support for English, Spanish, French, and German. Voice commands work in all languages.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Close when clicking outside
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Check compatibility
    window.app.checkCompatibility();
    
    // Add help button functionality
    const helpButtons = document.querySelectorAll('.help-btn, .voice-commands-help h3');
    helpButtons.forEach(btn => {
        btn.addEventListener('click', () => window.app.showHelp());
    });
});

// Service Worker registration and PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.error('❌ Service Worker registration failed:', error);
            });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'CHECK_READY_MESSAGES':
                    if (window.vault) {
                        window.vault.loadMessages();
                    }
                    break;
                case 'UPDATE_AVAILABLE':
                    showUpdateNotification();
                    break;
            }
        });
    });
}

// PWA Install functionality
let deferredPrompt;
let installButton;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

window.addEventListener('appinstalled', (evt) => {
    console.log('🎉 PWA was installed');
    hideInstallButton();
    if (window.app) {
        window.app.showNotification('2FutureMe installed successfully! You can now access it from your home screen.', 'success');
    }
});

function showInstallButton() {
    // Create install banner
    const installBanner = document.createElement('div');
    installBanner.id = 'installBanner';
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="install-banner-content">
            <div class="install-banner-icon">
                <i class="fas fa-download"></i>
            </div>
            <div class="install-banner-text">
                <h4>Install 2FutureMe</h4>
                <p>Add to your home screen for the best experience</p>
            </div>
            <div class="install-banner-actions">
                <button id="installApp" class="install-btn">
                    <i class="fas fa-plus"></i> Install
                </button>
                <button id="dismissInstall" class="dismiss-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // Add event listeners
    document.getElementById('installApp').addEventListener('click', installPWA);
    document.getElementById('dismissInstall').addEventListener('click', hideInstallButton);
    
    installButton = document.getElementById('installApp');
    
    // Show banner with animation
    setTimeout(() => {
        installBanner.classList.add('show');
    }, 1000);
}

function hideInstallButton() {
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.classList.remove('show');
        setTimeout(() => {
            installBanner.remove();
        }, 300);
    }
}

async function installPWA() {
    if (!deferredPrompt) {
        console.log('❌ No install prompt available');
        return;
    }
    
    try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
        }
        
        deferredPrompt = null;
        hideInstallButton();
    } catch (error) {
        console.error('❌ Install prompt error:', error);
    }
}

function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
        <div class="update-banner-content">
            <div class="update-banner-icon">
                <i class="fas fa-sync-alt"></i>
            </div>
            <div class="update-banner-text">
                <h4>Update Available</h4>
                <p>A new version of 2FutureMe is ready</p>
            </div>
            <div class="update-banner-actions">
                <button id="updateApp" class="update-btn">
                    <i class="fas fa-arrow-up"></i> Update
                </button>
                <button id="dismissUpdate" class="dismiss-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(updateBanner);
    
    document.getElementById('updateApp').addEventListener('click', () => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    });
    
    document.getElementById('dismissUpdate').addEventListener('click', () => {
        updateBanner.remove();
    });
    
    setTimeout(() => {
        updateBanner.classList.add('show');
    }, 100);
}