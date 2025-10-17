/**
 * Premium Features System
 * Handles message encryption, analytics, premium delivery options, and user engagement tracking
 */

class PremiumFeatures {
    constructor() {
        this.isPremium = this.checkPremiumStatus();
        this.encryptionKey = null;
        this.analytics = {
            events: [],
            userJourney: [],
            voiceUsage: {},
            preparationData: {}
        };
        
        this.init();
    }

    init() {
        this.setupEncryption();
        this.setupAnalytics();
        this.setupPremiumUI();
        this.initializeEngagementTracking();
    }

    checkPremiumStatus() {
        // Check if user has premium subscription
        const premiumStatus = localStorage.getItem('2futureme_premium');
        return premiumStatus === 'active';
    }

    /* ===== ENCRYPTION SYSTEM ===== */
    async setupEncryption() {
        if (this.isPremium) {
            await this.generateEncryptionKey();
        }
    }

    async generateEncryptionKey() {
        try {
            if (crypto.subtle) {
                this.encryptionKey = await crypto.subtle.generateKey(
                    {
                        name: 'AES-GCM',
                        length: 256
                    },
                    true,
                    ['encrypt', 'decrypt']
                );
            }
        } catch (error) {
            console.warn('Encryption not available:', error);
        }
    }

    async encryptMessage(message) {
        if (!this.encryptionKey || !crypto.subtle) {
            return message; // Return unencrypted if not available
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify(message));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                data
            );

            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv),
                isEncrypted: true
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            return message;
        }
    }

    async decryptMessage(encryptedMessage) {
        if (!encryptedMessage.isEncrypted || !this.encryptionKey) {
            return encryptedMessage;
        }

        try {
            const encrypted = new Uint8Array(encryptedMessage.encrypted);
            const iv = new Uint8Array(encryptedMessage.iv);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                encrypted
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption failed:', error);
            return encryptedMessage;
        }
    }

    /* ===== ANALYTICS SYSTEM ===== */
    setupAnalytics() {
        this.trackPageLoad();
        this.setupEventTracking();
        this.setupUserJourneyTracking();
        this.setupVoiceAnalytics();
    }

    trackPageLoad() {
        this.trackEvent('page_load', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            isPremium: this.isPremium,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }

    trackEvent(eventName, eventData = {}) {
        const event = {
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };

        this.analytics.events.push(event);
        this.saveAnalyticsData();

        // Send to analytics service if available
        if (window.gtag) {
            window.gtag('event', eventName, {
                custom_parameter: JSON.stringify(eventData)
            });
        }
    }

    setupEventTracking() {
        // Track voice interactions
        window.addEventListener('voiceCommandExecuted', (event) => {
            this.trackEvent('voice_command', {
                command: event.detail.command,
                confidence: event.detail.confidence,
                language: event.detail.language
            });
        });

        // Track preparation flow
        window.addEventListener('preparationStepCompleted', (event) => {
            this.trackEvent('preparation_step', {
                step: event.detail.step,
                timeSpent: event.detail.timeSpent,
                answers: event.detail.answers
            });
        });

        // Track message creation
        window.addEventListener('messageCreated', (event) => {
            this.trackEvent('message_created', {
                type: event.detail.type,
                language: event.detail.language,
                hasPhoto: event.detail.hasPhoto,
                deliveryMethod: event.detail.deliveryMethod
            });
        });
    }

    setupUserJourneyTracking() {
        // Track page sections visited
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.trackJourneyStep(entry.target.dataset.section || 'unknown');
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-section]').forEach(section => {
            observer.observe(section);
        });
    }

    trackJourneyStep(section) {
        const step = {
            section,
            timestamp: Date.now(),
            timeSpent: this.calculateTimeSpent()
        };

        this.analytics.userJourney.push(step);
        this.saveAnalyticsData();
    }

    setupVoiceAnalytics() {
        // Track voice usage patterns
        window.addEventListener('voiceActivated', () => {
            const today = new Date().toDateString();
            if (!this.analytics.voiceUsage[today]) {
                this.analytics.voiceUsage[today] = {
                    activations: 0,
                    commands: [],
                    totalTime: 0
                };
            }
            this.analytics.voiceUsage[today].activations++;
        });
    }

    /* ===== PREMIUM DELIVERY OPTIONS ===== */
    getPremiumDeliveryOptions() {
        return [
            {
                id: 'premium_email',
                name: 'Premium Email',
                description: 'Beautiful HTML email with custom design',
                price: 'Included',
                features: ['Custom templates', 'Rich media support', 'Scheduled delivery']
            },
            {
                id: 'physical_letter',
                name: 'Physical Letter',
                description: 'Printed and mailed to your address',
                price: '$9.99',
                features: ['Premium paper', 'Custom envelope', 'Tracked delivery']
            },
            {
                id: 'video_message',
                name: 'Video Message',
                description: 'Create a video message for your future self',
                price: 'Included',
                features: ['HD quality', 'Custom thumbnails', 'Private hosting']
            },
            {
                id: 'voice_call',
                name: 'Voice Call',
                description: 'Receive your message as a phone call',
                price: '$4.99',
                features: ['AI voice synthesis', 'Scheduled calling', 'Multiple attempts']
            }
        ];
    }

    setupPremiumUI() {
        if (this.isPremium) {
            this.addPremiumBadges();
            this.enablePremiumFeatures();
        } else {
            this.addUpgradePrompts();
        }
    }

    addPremiumBadges() {
        const premiumBadge = document.createElement('div');
        premiumBadge.className = 'premium-badge';
        premiumBadge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Premium
        `;
        
        document.querySelector('.header').appendChild(premiumBadge);
    }

    enablePremiumFeatures() {
        // Enable encryption toggle
        this.addEncryptionToggle();
        
        // Enable advanced analytics
        this.enableAdvancedAnalytics();
        
        // Enable premium delivery options
        this.addPremiumDeliveryOptions();
    }

    addEncryptionToggle() {
        const encryptionToggle = document.createElement('div');
        encryptionToggle.className = 'encryption-toggle';
        encryptionToggle.innerHTML = `
            <label class="toggle-switch">
                <input type="checkbox" id="encryption-enabled" checked>
                <span class="toggle-slider"></span>
                <span class="toggle-label">End-to-end encryption</span>
            </label>
        `;
        
        const messagePreview = document.querySelector('.message-preview');
        if (messagePreview) {
            messagePreview.appendChild(encryptionToggle);
        }
    }

    addPremiumDeliveryOptions() {
        const deliverySection = document.createElement('div');
        deliverySection.className = 'premium-delivery-section';
        deliverySection.innerHTML = `
            <h3>Premium Delivery Options</h3>
            <div class="delivery-options-grid">
                ${this.getPremiumDeliveryOptions().map(option => `
                    <div class="delivery-option" data-option="${option.id}">
                        <h4>${option.name}</h4>
                        <p>${option.description}</p>
                        <div class="option-price">${option.price}</div>
                        <ul class="option-features">
                            ${option.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
        
        const vaultSection = document.querySelector('.vault-section');
        if (vaultSection) {
            vaultSection.appendChild(deliverySection);
        }
    }

    addUpgradePrompts() {
        const upgradePrompt = document.createElement('div');
        upgradePrompt.className = 'upgrade-prompt glass-card';
        upgradePrompt.innerHTML = `
            <div class="upgrade-content">
                <h3>Unlock Premium Features</h3>
                <ul class="premium-features-list">
                    <li>🔒 End-to-end encryption</li>
                    <li>📮 Physical letter delivery</li>
                    <li>🎥 Video messages</li>
                    <li>📞 Voice call delivery</li>
                    <li>📊 Detailed analytics</li>
                    <li>🎨 Custom themes</li>
                </ul>
                <button class="btn btn-primary upgrade-btn">
                    Upgrade to Premium - $9.99/month
                </button>
            </div>
        `;
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(upgradePrompt);
        }
    }

    /* ===== ENGAGEMENT TRACKING ===== */
    initializeEngagementTracking() {
        this.trackScrollDepth();
        this.trackTimeSpent();
        this.trackInteractionQuality();
    }

    trackScrollDepth() {
        let maxScroll = 0;
        const trackScroll = this.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.trackEvent('scroll_depth', { depth: scrollPercent });
            }
        }, 1000);

        window.addEventListener('scroll', trackScroll);
    }

    trackTimeSpent() {
        const startTime = Date.now();
        let isActive = true;

        // Track when user becomes inactive
        const trackInactivity = () => {
            isActive = false;
            setTimeout(() => {
                if (!isActive) {
                    this.trackEvent('session_inactive', {
                        timeSpent: Date.now() - startTime
                    });
                }
            }, 30000); // 30 seconds of inactivity
        };

        // Track when user becomes active
        const trackActivity = () => {
            isActive = true;
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, trackActivity, true);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                trackInactivity();
            } else {
                trackActivity();
            }
        });
    }

    trackInteractionQuality() {
        // Track preparation completion rate
        window.addEventListener('preparationCompleted', (event) => {
            this.analytics.preparationData = {
                completed: true,
                timeSpent: event.detail.timeSpent,
                skipped: false,
                answers: event.detail.answers
            };
        });

        // Track voice command success rate
        let voiceCommandsAttempted = 0;
        let voiceCommandsSuccessful = 0;

        window.addEventListener('voiceCommandAttempted', () => {
            voiceCommandsAttempted++;
        });

        window.addEventListener('voiceCommandExecuted', () => {
            voiceCommandsSuccessful++;
            
            if (voiceCommandsAttempted > 0) {
                this.trackEvent('voice_success_rate', {
                    rate: (voiceCommandsSuccessful / voiceCommandsAttempted) * 100
                });
            }
        });
    }

    /* ===== UTILITY METHODS ===== */
    getSessionId() {
        let sessionId = sessionStorage.getItem('2futureme_session');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('2futureme_session', sessionId);
        }
        return sessionId;
    }

    calculateTimeSpent() {
        const lastStep = this.analytics.userJourney[this.analytics.userJourney.length - 1];
        return lastStep ? Date.now() - lastStep.timestamp : 0;
    }

    saveAnalyticsData() {
        try {
            localStorage.setItem('2futureme_analytics', JSON.stringify(this.analytics));
        } catch (error) {
            console.warn('Could not save analytics data:', error);
        }
    }

    loadAnalyticsData() {
        try {
            const saved = localStorage.getItem('2futureme_analytics');
            if (saved) {
                this.analytics = { ...this.analytics, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Could not load analytics data:', error);
        }
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /* ===== EXPORT ANALYTICS ===== */
    exportAnalytics() {
        const data = {
            ...this.analytics,
            exportDate: new Date().toISOString(),
            isPremium: this.isPremium
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `2futureme-analytics-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize premium features
const premiumFeatures = new PremiumFeatures();

// Export for global access
window.premiumFeatures = premiumFeatures;