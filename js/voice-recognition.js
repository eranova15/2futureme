class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentLanguage = 'en-US';
        this.lastResult = '';
        this.confidenceThreshold = 0.5;
        
        // Voice commands in multiple languages
        this.commands = {
            'en-US': {
                'start listening': () => this.startListening(),
                'stop listening': () => this.stopListening(),
                'go back': () => this.goBack(),
                'go home': () => this.goHome(),
                'next': () => this.next(),
                'previous': () => this.previous(),
                'start recording': () => this.startRecording(),
                'stop recording': () => this.stopRecording(),
                'take photo': () => this.takePhoto(),
                'save message': () => this.saveMessage(),
                'discard': () => this.discardMessage(),
                'show vault': () => this.showVault(),
                'change language to spanish': () => this.changeLanguage('es-ES'),
                'change language to french': () => this.changeLanguage('fr-FR'),
                'change language to german': () => this.changeLanguage('de-DE'),
                'change language to english': () => this.changeLanguage('en-US'),
                'english': () => this.changeLanguage('en-US'),
                'spanish': () => this.changeLanguage('es-ES'),
                'french': () => this.changeLanguage('fr-FR'),
                'german': () => this.changeLanguage('de-DE')
            },
            'es-ES': {
                'empezar a escuchar': () => this.startListening(),
                'parar de escuchar': () => this.stopListening(),
                'volver': () => this.goBack(),
                'ir a inicio': () => this.goHome(),
                'siguiente': () => this.next(),
                'anterior': () => this.previous(),
                'empezar grabación': () => this.startRecording(),
                'parar grabación': () => this.stopRecording(),
                'tomar foto': () => this.takePhoto(),
                'guardar mensaje': () => this.saveMessage(),
                'descartar': () => this.discardMessage(),
                'mostrar bóveda': () => this.showVault(),
                'cambiar idioma a inglés': () => this.changeLanguage('en-US'),
                'cambiar idioma a francés': () => this.changeLanguage('fr-FR'),
                'cambiar idioma a alemán': () => this.changeLanguage('de-DE'),
                'inglés': () => this.changeLanguage('en-US'),
                'francés': () => this.changeLanguage('fr-FR'),
                'alemán': () => this.changeLanguage('de-DE')
            },
            'fr-FR': {
                'commencer à écouter': () => this.startListening(),
                'arrêter d\'écouter': () => this.stopListening(),
                'retour': () => this.goBack(),
                'aller à l\'accueil': () => this.goHome(),
                'suivant': () => this.next(),
                'précédent': () => this.previous(),
                'commencer l\'enregistrement': () => this.startRecording(),
                'arrêter l\'enregistrement': () => this.stopRecording(),
                'prendre photo': () => this.takePhoto(),
                'sauvegarder message': () => this.saveMessage(),
                'rejeter': () => this.discardMessage(),
                'montrer coffre': () => this.showVault(),
                'changer langue en anglais': () => this.changeLanguage('en-US'),
                'changer langue en espagnol': () => this.changeLanguage('es-ES'),
                'changer langue en allemand': () => this.changeLanguage('de-DE'),
                'anglais': () => this.changeLanguage('en-US'),
                'espagnol': () => this.changeLanguage('es-ES'),
                'allemand': () => this.changeLanguage('de-DE')
            },
            'de-DE': {
                'anfangen zu hören': () => this.startListening(),
                'aufhören zu hören': () => this.stopListening(),
                'zurück': () => this.goBack(),
                'zur startseite': () => this.goHome(),
                'nächste': () => this.next(),
                'vorherige': () => this.previous(),
                'aufnahme starten': () => this.startRecording(),
                'aufnahme stoppen': () => this.stopRecording(),
                'foto machen': () => this.takePhoto(),
                'nachricht speichern': () => this.saveMessage(),
                'verwerfen': () => this.discardMessage(),
                'tresor zeigen': () => this.showVault(),
                'sprache zu englisch ändern': () => this.changeLanguage('en-US'),
                'sprache zu spanisch ändern': () => this.changeLanguage('es-ES'),
                'sprache zu französisch ändern': () => this.changeLanguage('fr-FR'),
                'englisch': () => this.changeLanguage('en-US'),
                'spanisch': () => this.changeLanguage('es-ES'),
                'französisch': () => this.changeLanguage('fr-FR')
            }
        };

        this.init();
    }

    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            this.showError('Voice recognition is not supported in your browser. Please use Chrome or Firefox.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage;
        
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI();
            console.log('Voice recognition started');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI();
            console.log('Voice recognition ended');
            
            // Auto-restart if was listening
            if (this.shouldRestart) {
                setTimeout(() => this.startListening(), 1000);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateUI();
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence;
                
                if (event.results[i].isFinal) {
                    if (confidence > this.confidenceThreshold) {
                        finalTranscript += transcript;
                    }
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.processCommand(finalTranscript.toLowerCase().trim());
                this.lastResult = finalTranscript;
            }

            // Update UI with interim results
            if (interimTranscript) {
                this.updateInterimResult(interimTranscript);
            }
        };
    }

    startListening() {
        if (!this.recognition) {
            this.init();
            return;
        }

        if (!this.isListening) {
            this.shouldRestart = true;
            this.recognition.start();
        }
    }

    stopListening() {
        this.shouldRestart = false;
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
        
        // Update UI
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });

        this.showFeedback(`Language changed to ${this.getLanguageName(lang)}`);
        
        // Restart recognition with new language
        if (this.isListening) {
            this.stopListening();
            setTimeout(() => this.startListening(), 500);
        }
    }

    getLanguageName(lang) {
        const names = {
            'en-US': 'English',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German'
        };
        return names[lang] || lang;
    }

    processCommand(command) {
        console.log('Processing command:', command);
        
        const currentCommands = this.commands[this.currentLanguage] || this.commands['en-US'];
        
        // Direct match
        if (currentCommands[command]) {
            currentCommands[command]();
            this.showFeedback(`Command recognized: "${command}"`);
            return;
        }

        // Fuzzy matching for partial commands
        for (const [key, action] of Object.entries(currentCommands)) {
            if (command.includes(key) || this.similarity(command, key) > 0.7) {
                action();
                this.showFeedback(`Command recognized: "${key}"`);
                return;
            }
        }

        // If no command matched, show available commands
        this.showFeedback(`Command not recognized: "${command}". Say "help" for available commands.`);
    }

    similarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
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

    // Command implementations
    goBack() {
        if (window.app && window.app.goBack) {
            window.app.goBack();
        }
    }

    goHome() {
        if (window.app && window.app.goHome) {
            window.app.goHome();
        }
    }

    next() {
        if (window.app && window.app.next) {
            window.app.next();
        }
    }

    previous() {
        if (window.app && window.app.previous) {
            window.app.previous();
        }
    }

    startRecording() {
        if (window.recorder && window.recorder.start) {
            window.recorder.start();
        }
    }

    stopRecording() {
        if (window.recorder && window.recorder.stop) {
            window.recorder.stop();
        }
    }

    takePhoto() {
        if (window.camera && window.camera.takePhoto) {
            window.camera.takePhoto();
        }
    }

    saveMessage() {
        if (window.vault && window.vault.saveCurrentMessage) {
            window.vault.saveCurrentMessage();
        }
    }

    discardMessage() {
        if (window.app && window.app.discardCurrentMessage) {
            window.app.discardCurrentMessage();
        }
    }

    showVault() {
        if (window.app && window.app.showVault) {
            window.app.showVault();
        }
    }

    updateUI() {
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) {
            if (this.isListening) {
                voiceStatus.innerHTML = '<i class="fas fa-microphone"></i><span>Listening...</span>';
                voiceStatus.classList.add('listening');
            } else {
                voiceStatus.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Say "Start Listening" to begin</span>';
                voiceStatus.classList.remove('listening');
            }
        }
    }

    updateInterimResult(interim) {
        // Could show interim results in a small overlay
        console.log('Interim:', interim);
    }

    showFeedback(message) {
        console.log('Voice feedback:', message);
        
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = 'voice-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'voice-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        document.body.appendChild(errorDiv);
    }
}

// Initialize voice recognition when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceRecognition = new VoiceRecognition();
});