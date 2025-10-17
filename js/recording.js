class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.stream = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.audioBlob = null;
        
        this.init();
    }

    async init() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            this.setupRecorder();
            this.setupEventListeners();
            console.log('Voice recorder initialized');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showError('Microphone access denied. Please allow microphone access to record voice messages.');
        }
    }

    setupRecorder() {
        // Check for supported MIME types
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/webm',
            'audio/ogg'
        ];

        let selectedMimeType = 'audio/webm';
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
            }
        }

        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: selectedMimeType,
            audioBitsPerSecond: 128000
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
            this.audioChunks = [];
            this.createAudioPreview();
        };

        this.mediaRecorder.onstart = () => {
            console.log('Recording started');
            this.startTimer();
        };

        this.mediaRecorder.onpause = () => {
            console.log('Recording paused');
            this.pauseTimer();
        };

        this.mediaRecorder.onresume = () => {
            console.log('Recording resumed');
            this.resumeTimer();
        };
    }

    setupEventListeners() {
        const startBtn = document.getElementById('startVoiceBtn');
        const pauseBtn = document.getElementById('pauseVoiceBtn');
        const stopBtn = document.getElementById('stopVoiceBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }

        // Voice command integration
        window.recorder = this;
    }

    start() {
        if (!this.mediaRecorder) {
            this.showError('Recorder not initialized. Please check microphone permissions.');
            return;
        }

        if (this.isRecording) {
            this.showError('Already recording');
            return;
        }

        try {
            this.audioChunks = [];
            this.startTime = Date.now();
            this.pausedTime = 0;
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.isPaused = false;
            this.updateUI();
            
            // Provide voice feedback
            if (window.voiceRecognition) {
                window.voiceRecognition.showFeedback('Recording started');
            }
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording');
        }
    }

    stop() {
        if (!this.isRecording) {
            return;
        }

        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.stopTimer();
            this.updateUI();
            
            // Provide voice feedback
            if (window.voiceRecognition) {
                window.voiceRecognition.showFeedback('Recording stopped');
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Failed to stop recording');
        }
    }

    togglePause() {
        if (!this.isRecording) {
            return;
        }

        try {
            if (this.isPaused) {
                this.mediaRecorder.resume();
                this.isPaused = false;
            } else {
                this.mediaRecorder.pause();
                this.isPaused = true;
            }
            this.updateUI();
        } catch (error) {
            console.error('Error toggling pause:', error);
            this.showError('Failed to pause/resume recording');
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 100);
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resumeTimer() {
        this.startTimer();
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.startTime) return;

        const elapsed = Date.now() - this.startTime - this.pausedTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const milliseconds = Math.floor((elapsed % 1000) / 10);

        const timerElement = document.getElementById('recordingTimer');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        }
    }

    createAudioPreview() {
        if (!this.audioBlob) return;

        const audioUrl = URL.createObjectURL(this.audioBlob);
        const audioElement = document.getElementById('voicePlayback');
        
        if (audioElement) {
            audioElement.src = audioUrl;
            audioElement.style.display = 'block';
            audioElement.load();
        }

        // Show message preview
        this.showMessagePreview();
    }

    showMessagePreview() {
        const previewSection = document.getElementById('messagePreview');
        const previewContent = document.getElementById('previewContent');
        
        if (previewSection && previewContent) {
            previewContent.innerHTML = `
                <div class="audio-message-preview">
                    <i class="fas fa-microphone fa-2x"></i>
                    <h4>Voice Message</h4>
                    <p>Duration: ${this.getRecordingDuration()}</p>
                    <audio controls>
                        <source src="${URL.createObjectURL(this.audioBlob)}" type="${this.audioBlob.type}">
                        Your browser does not support audio playback.
                    </audio>
                </div>
            `;
            
            previewSection.classList.remove('hidden');
            
            // Scroll to preview
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    getRecordingDuration() {
        if (!this.startTime) return '00:00';
        
        const duration = Date.now() - this.startTime - this.pausedTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getCurrentRecording() {
        return {
            type: 'voice',
            blob: this.audioBlob,
            duration: this.getRecordingDuration(),
            timestamp: new Date().toISOString(),
            mimeType: this.audioBlob ? this.audioBlob.type : null
        };
    }

    discardRecording() {
        this.audioBlob = null;
        this.audioChunks = [];
        
        const audioElement = document.getElementById('voicePlayback');
        if (audioElement) {
            audioElement.style.display = 'none';
            audioElement.src = '';
        }
        
        const previewSection = document.getElementById('messagePreview');
        if (previewSection) {
            previewSection.classList.add('hidden');
        }
        
        this.updateUI();
    }

    updateUI() {
        const startBtn = document.getElementById('startVoiceBtn');
        const controls = document.getElementById('voiceControls');
        const pauseBtn = document.getElementById('pauseVoiceBtn');
        const voiceCard = document.getElementById('voiceCard');

        if (this.isRecording) {
            if (startBtn) startBtn.style.display = 'none';
            if (controls) controls.classList.remove('hidden');
            if (voiceCard) voiceCard.classList.add('recording');
            
            if (pauseBtn) {
                if (this.isPaused) {
                    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
                    pauseBtn.classList.add('paused');
                } else {
                    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                    pauseBtn.classList.remove('paused');
                }
            }
        } else {
            if (startBtn) startBtn.style.display = 'block';
            if (controls) controls.classList.add('hidden');
            if (voiceCard) voiceCard.classList.remove('recording');
            
            // Reset timer display
            const timerElement = document.getElementById('recordingTimer');
            if (timerElement) {
                timerElement.textContent = '00:00';
            }
        }
    }

    showError(message) {
        console.error('Recorder error:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'recording-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        const voiceCard = document.getElementById('voiceCard');
        if (voiceCard) {
            voiceCard.appendChild(errorDiv);
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    // Cleanup method
    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stopTimer();
    }
}

// Initialize recorder when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.recorder = new VoiceRecorder();
});