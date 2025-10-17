/**
 * Enhanced Voice Interaction System
 * Provides advanced voice feedback, animations, and multi-language support
 */

class VoiceInteractionEnhancer {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.visualizer = null;
        this.confidenceThreshold = 0.7;
        this.initializeAudioContext();
        this.initializeVoiceVisualizer();
        this.setupVoiceFeedback();
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
        } catch (error) {
            console.warn('Audio context not available:', error);
        }
    }

    initializeVoiceVisualizer() {
        // Create voice waveform visualizer
        const voiceStatus = document.querySelector('.voice-status');
        if (voiceStatus) {
            const visualizer = document.createElement('div');
            visualizer.className = 'voice-visualizer';
            visualizer.innerHTML = `
                <div class="wave-container">
                    <div class="wave-bar" style="--delay: 0s"></div>
                    <div class="wave-bar" style="--delay: 0.1s"></div>
                    <div class="wave-bar" style="--delay: 0.2s"></div>
                    <div class="wave-bar" style="--delay: 0.3s"></div>
                    <div class="wave-bar" style="--delay: 0.4s"></div>
                </div>
            `;
            voiceStatus.appendChild(visualizer);
        }
    }

    setupVoiceFeedback() {
        // Add haptic feedback for mobile devices
        this.hapticFeedback = {
            light: () => {
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            },
            medium: () => {
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]);
                }
            },
            heavy: () => {
                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                }
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            this.initializeRecognition();
        }

        this.isListening = true;
        this.updateVoiceStatus('listening');
        this.startVisualizer();
        this.hapticFeedback.light();
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Recognition start error:', error);
            this.showVoiceError('Could not start voice recognition');
        }
    }

    stopListening() {
        this.isListening = false;
        this.updateVoiceStatus('idle');
        this.stopVisualizer();
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    initializeRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showVoiceError('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;
        
        // Get current language from the app
        const currentLang = document.querySelector('.language-card.active')?.dataset.lang || 'en-US';
        this.recognition.lang = currentLang;

        this.recognition.onstart = () => {
            this.updateVoiceStatus('listening');
            this.showVoiceFeedback('Listening...', 'info');
        };

        this.recognition.onresult = (event) => {
            this.handleVoiceResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleVoiceError(event);
        };

        this.recognition.onend = () => {
            this.updateVoiceStatus('idle');
            this.stopVisualizer();
        };
    }

    handleVoiceResult(event) {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;

        // Show real-time transcript
        this.showTranscript(transcript, result.isFinal);

        if (result.isFinal && confidence > this.confidenceThreshold) {
            this.processVoiceCommand(transcript);
            this.hapticFeedback.medium();
        }
    }

    handleVoiceError(event) {
        let errorMessage = 'Voice recognition error';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not accessible';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied';
                break;
            case 'network':
                errorMessage = 'Network error occurred';
                break;
        }

        this.showVoiceError(errorMessage);
        this.stopListening();
    }

    processVoiceCommand(command) {
        const commands = {
            // Language selection
            'english': () => this.selectLanguage('en-US'),
            'spanish': () => this.selectLanguage('es-ES'),
            'french': () => this.selectLanguage('fr-FR'),
            'german': () => this.selectLanguage('de-DE'),
            'italiano': () => this.selectLanguage('it-IT'),
            'português': () => this.selectLanguage('pt-BR'),
            
            // Actions
            'record message': () => this.triggerAction('record'),
            'record audio': () => this.triggerAction('record'),
            'take photo': () => this.triggerAction('photo'),
            'take picture': () => this.triggerAction('photo'),
            'capture image': () => this.triggerAction('photo'),
            
            // Playback controls
            'play': () => this.controlPlayback('play'),
            'pause': () => this.controlPlayback('pause'),
            'stop': () => this.controlPlayback('stop'),
            
            // Message actions
            'save message': () => this.saveMessage(),
            'delete message': () => this.deleteMessage(),
            'discard': () => this.deleteMessage(),
            
            // Navigation
            'show vault': () => this.showVault(),
            'hide vault': () => this.hideVault(),
            'go back': () => this.goBack(),
            
            // Preparation flow
            'start preparation': () => this.startPreparation(),
            'skip preparation': () => this.skipPreparation(),
            'next step': () => this.nextPreparationStep(),
            'previous step': () => this.previousPreparationStep(),
        };

        // Find matching command
        const matchedCommand = Object.keys(commands).find(cmd => 
            command.includes(cmd) || this.fuzzyMatch(command, cmd)
        );

        if (matchedCommand) {
            this.showVoiceFeedback(`Executing: ${matchedCommand}`, 'success');
            commands[matchedCommand]();
            this.hapticFeedback.heavy();
        } else {
            this.showVoiceFeedback('Command not recognized', 'warning');
            this.suggestCommands(command);
        }
    }

    fuzzyMatch(input, target, threshold = 0.7) {
        const distance = this.levenshteinDistance(input, target);
        const similarity = 1 - (distance / Math.max(input.length, target.length));
        return similarity >= threshold;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    updateVoiceStatus(status) {
        const voiceStatus = document.querySelector('.voice-status');
        if (!voiceStatus) return;

        voiceStatus.className = `voice-status ${status}`;
        
        const statusText = voiceStatus.querySelector('.status-text');
        const statusTexts = {
            idle: 'Say "Record message" to start',
            listening: 'Listening...',
            processing: 'Processing...',
            error: 'Voice recognition error'
        };

        if (statusText) {
            statusText.textContent = statusTexts[status] || 'Ready';
        }
    }

    startVisualizer() {
        const visualizer = document.querySelector('.voice-visualizer');
        if (visualizer) {
            visualizer.classList.add('active');
        }
    }

    stopVisualizer() {
        const visualizer = document.querySelector('.voice-visualizer');
        if (visualizer) {
            visualizer.classList.remove('active');
        }
    }

    showTranscript(transcript, isFinal) {
        let transcriptElement = document.querySelector('.voice-transcript');
        
        if (!transcriptElement) {
            transcriptElement = document.createElement('div');
            transcriptElement.className = 'voice-transcript';
            document.querySelector('.voice-status').appendChild(transcriptElement);
        }

        transcriptElement.textContent = transcript;
        transcriptElement.className = `voice-transcript ${isFinal ? 'final' : 'interim'}`;

        if (isFinal) {
            setTimeout(() => {
                transcriptElement.style.opacity = '0';
                setTimeout(() => transcriptElement.remove(), 300);
            }, 2000);
        }
    }

    showVoiceFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `voice-feedback ${type}`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        // Animate in
        requestAnimationFrame(() => {
            feedback.style.opacity = '1';
            feedback.style.transform = 'translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-20px)';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }

    showVoiceError(message) {
        this.showVoiceFeedback(message, 'error');
        this.hapticFeedback.heavy();
    }

    suggestCommands(input) {
        const availableCommands = [
            'record message', 'take photo', 'save message', 
            'delete message', 'show vault', 'play', 'pause'
        ];
        
        const suggestions = availableCommands
            .map(cmd => ({ cmd, similarity: this.fuzzyMatch(input, cmd, 0) }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(item => item.cmd);

        if (suggestions.length > 0) {
            this.showVoiceFeedback(`Try: ${suggestions.join(', ')}`, 'info');
        }
    }

    // Command handlers
    selectLanguage(lang) {
        const langCard = document.querySelector(`[data-lang="${lang}"]`);
        if (langCard) {
            langCard.click();
            this.recognition.lang = lang;
        }
    }

    triggerAction(action) {
        const actionCard = document.querySelector(`[data-action="${action}"]`);
        if (actionCard) {
            actionCard.click();
        }
    }

    controlPlayback(action) {
        const audio = document.querySelector('audio');
        if (audio) {
            switch (action) {
                case 'play':
                    audio.play();
                    break;
                case 'pause':
                    audio.pause();
                    break;
                case 'stop':
                    audio.pause();
                    audio.currentTime = 0;
                    break;
            }
        }
    }

    saveMessage() {
        const saveBtn = document.querySelector('.btn-success');
        if (saveBtn) saveBtn.click();
    }

    deleteMessage() {
        const deleteBtn = document.querySelector('.btn-danger');
        if (deleteBtn) deleteBtn.click();
    }

    showVault() {
        const vaultSection = document.querySelector('.vault-section');
        if (vaultSection) {
            vaultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hideVault() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    }

    goBack() {
        window.history.back();
    }

    startPreparation() {
        const prepSection = document.querySelector('.preparation-section');
        if (prepSection && prepSection.style.display === 'none') {
            prepSection.style.display = 'block';
            prepSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    skipPreparation() {
        const skipBtn = document.querySelector('.skip-preparation');
        if (skipBtn) skipBtn.click();
    }

    nextPreparationStep() {
        const nextBtn = document.querySelector('.next-step');
        if (nextBtn) nextBtn.click();
    }

    previousPreparationStep() {
        const prevBtn = document.querySelector('.prev-step');
        if (prevBtn) prevBtn.click();
    }
}

// Initialize enhanced voice interaction
const voiceEnhancer = new VoiceInteractionEnhancer();

// Export for global access
window.voiceEnhancer = voiceEnhancer;