// Preparation Flow Controller
class PreparationFlow {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.answers = {
            intention: null,
            emotion: null,
            prepared: false
        };
        this.breathingTimer = null;
        this.breathingTimeLeft = 30;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateProgress();
        this.checkCompletion();
    }

    bindEvents() {
        // Skip preparation
        document.getElementById('skipPrep')?.addEventListener('click', () => {
            this.skipPreparation();
        });

        // Next step
        document.getElementById('nextPrepStep')?.addEventListener('click', () => {
            this.nextStep();
        });

        // Start recording
        document.getElementById('startRecording')?.addEventListener('click', () => {
            this.startMainApp();
        });

        // Intention selection
        document.querySelectorAll('input[name="intention"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.answers.intention = e.target.value;
                this.checkCompletion();
            });
        });

        // Emotion selection
        document.querySelectorAll('.emotion-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove previous selection
                document.querySelectorAll('.emotion-option').forEach(opt => 
                    opt.classList.remove('selected'));
                
                // Add selection to clicked option
                e.currentTarget.classList.add('selected');
                this.answers.emotion = e.currentTarget.dataset.emotion;
                this.checkCompletion();
            });
        });

        // Voice commands for preparation
        if (window.voiceRecognition) {
            window.voiceRecognition.addCommand('skip preparation', () => {
                this.skipPreparation();
            });

            window.voiceRecognition.addCommand('next step', () => {
                if (!document.getElementById('nextPrepStep').disabled) {
                    this.nextStep();
                }
            });

            window.voiceRecognition.addCommand('start recording', () => {
                if (this.currentStep === 3 && this.answers.prepared) {
                    this.startMainApp();
                }
            });
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('prepProgress');
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Show/hide question cards
        document.querySelectorAll('.question-card').forEach((card, index) => {
            const cardNumber = index + 1;
            card.classList.remove('active');
            
            if (cardNumber === this.currentStep) {
                card.classList.add('active');
            }
        });
    }

    checkCompletion() {
        const nextBtn = document.getElementById('nextPrepStep');
        const startBtn = document.getElementById('startRecording');
        let canProceed = false;

        switch (this.currentStep) {
            case 1:
                canProceed = this.answers.intention !== null;
                break;
            case 2:
                canProceed = this.answers.emotion !== null;
                break;
            case 3:
                canProceed = this.answers.prepared;
                break;
        }

        if (nextBtn) {
            nextBtn.disabled = !canProceed;
        }

        // Show start recording button on final step
        if (this.currentStep === 3) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (startBtn) {
                startBtn.style.display = canProceed ? 'inline-flex' : 'none';
            }
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateProgress();
            this.checkCompletion();

            // Start breathing exercise on step 3
            if (this.currentStep === 3) {
                this.startBreathingExercise();
            }

            // Add smooth transition animation
            const activeCard = document.querySelector('.question-card.active');
            if (activeCard) {
                activeCard.style.transform = 'translateX(-50px)';
                activeCard.style.opacity = '0.3';
                
                setTimeout(() => {
                    activeCard.style.transform = 'translateX(0)';
                    activeCard.style.opacity = '1';
                }, 300);
            }
        }
    }

    startBreathingExercise() {
        this.breathingTimeLeft = 30;
        const timerElement = document.getElementById('breathingTimer');
        
        this.breathingTimer = setInterval(() => {
            this.breathingTimeLeft--;
            
            if (timerElement) {
                const minutes = Math.floor(this.breathingTimeLeft / 60);
                const seconds = this.breathingTimeLeft % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            if (this.breathingTimeLeft <= 0) {
                this.completeBreathingExercise();
            }
        }, 1000);

        // Add voice feedback for breathing
        if (window.speechSynthesis) {
            const breathingPhases = [
                "Take a deep breath in...",
                "Hold for a moment...",
                "Slowly breathe out...",
                "You're doing great, keep breathing naturally..."
            ];

            let phaseIndex = 0;
            const breathingGuidance = setInterval(() => {
                if (this.breathingTimeLeft <= 0) {
                    clearInterval(breathingGuidance);
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(breathingPhases[phaseIndex]);
                utterance.rate = 0.8;
                utterance.volume = 0.7;
                window.speechSynthesis.speak(utterance);

                phaseIndex = (phaseIndex + 1) % breathingPhases.length;
            }, 7000);
        }
    }

    completeBreathingExercise() {
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
            this.breathingTimer = null;
        }

        this.answers.prepared = true;
        this.checkCompletion();

        // Show completion message
        const breathingCircle = document.getElementById('breathingCircle');
        if (breathingCircle) {
            breathingCircle.style.borderColor = '#10b981';
            breathingCircle.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.4)';
        }

        const breathingText = document.querySelector('.breathing-text');
        if (breathingText) {
            breathingText.textContent = 'Complete!';
        }

        // Voice feedback
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance("Perfect! You're now centered and ready to create your message to your future self.");
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }

    skipPreparation() {
        // Track that user skipped
        this.logEvent('preparation_skipped', {
            step: this.currentStep,
            answers: this.answers
        });

        this.startMainApp();
    }

    startMainApp() {
        const prepFlow = document.getElementById('preparationFlow');
        const mainApp = document.getElementById('mainApp');

        if (prepFlow && mainApp) {
            // Add exit animation
            prepFlow.style.opacity = '0';
            prepFlow.style.transform = 'translateY(-50px)';
            
            setTimeout(() => {
                prepFlow.style.display = 'none';
                mainApp.style.display = 'block';
                mainApp.classList.add('visible');

                // Track completion
                this.logEvent('preparation_completed', {
                    completed_all_steps: this.currentStep === 3 && this.answers.prepared,
                    answers: this.answers
                });
            }, 300);
        }

        // Initialize voice recognition for main app
        if (window.voiceRecognition) {
            window.voiceRecognition.init();
        }
    }

    logEvent(eventName, data) {
        // Analytics tracking
        console.log(`Preparation Event: ${eventName}`, data);
        
        // You could send this to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_parameter: JSON.stringify(data)
            });
        }
    }
}

// Animation helpers for smooth transitions
class AnimationHelper {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.max(1 - progress, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    static slideUp(element, distance = 50, duration = 300) {
        element.style.transform = `translateY(${distance}px)`;
        element.style.opacity = '0';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            const currentY = distance * (1 - easeOutCubic);
            element.style.transform = `translateY(${currentY}px)`;
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize preparation flow when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('preparationFlow')) {
        window.preparationFlow = new PreparationFlow();
    }
});