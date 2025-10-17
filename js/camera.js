class CameraCapture {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.capturedImage = null;
        this.isStreaming = false;
        
        this.init();
    }

    async init() {
        this.video = document.getElementById('cameraPreview');
        this.canvas = document.getElementById('photoCanvas');
        
        if (this.canvas) {
            this.context = this.canvas.getContext('2d');
        }
        
        this.setupEventListeners();
        console.log('Camera system initialized');
    }

    setupEventListeners() {
        const startBtn = document.getElementById('startPhotoBtn');
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCamera());
        }

        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.retake());
        }

        // Voice command integration
        window.camera = this;
    }

    async startCamera() {
        try {
            // Request camera access with optimal settings for document capture
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    aspectRatio: { ideal: 16/9 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (this.video) {
                this.video.srcObject = this.stream;
                this.video.play();
                
                this.video.addEventListener('loadedmetadata', () => {
                    this.isStreaming = true;
                    this.updateUI();
                });
            }

            // Provide voice feedback
            if (window.voiceRecognition) {
                window.voiceRecognition.showFeedback('Camera started');
            }

        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Camera access denied. Please allow camera access to take photos of your handwritten letters.');
        }
    }

    capturePhoto() {
        if (!this.isStreaming || !this.video || !this.canvas || !this.context) {
            this.showError('Camera not ready');
            return;
        }

        try {
            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            // Draw the video frame to canvas
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Convert to blob for storage
            this.canvas.toBlob((blob) => {
                this.capturedImage = blob;
                this.showPhotoPreview();
            }, 'image/jpeg', 0.9);

            // Provide voice feedback
            if (window.voiceRecognition) {
                window.voiceRecognition.showFeedback('Photo captured');
            }

        } catch (error) {
            console.error('Error capturing photo:', error);
            this.showError('Failed to capture photo');
        }
    }

    retake() {
        this.capturedImage = null;
        this.hidePhotoPreview();
        
        // Restart camera if it was stopped
        if (!this.isStreaming) {
            this.startCamera();
        }
        
        this.updateUI();
    }

    takePhoto() {
        if (!this.isStreaming) {
            this.startCamera();
        } else {
            this.capturePhoto();
        }
    }

    showPhotoPreview() {
        if (!this.capturedImage) return;

        // Stop camera stream
        this.stopCamera();

        // Show captured image on canvas
        const imageUrl = URL.createObjectURL(this.capturedImage);
        const img = new Image();
        
        img.onload = () => {
            if (this.canvas && this.context) {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.context.drawImage(img, 0, 0);
                this.canvas.classList.remove('hidden');
            }
            
            // Show message preview
            this.showMessagePreview();
            URL.revokeObjectURL(imageUrl);
        };
        
        img.src = imageUrl;
        this.updateUI();
    }

    hidePhotoPreview() {
        if (this.canvas) {
            this.canvas.classList.add('hidden');
        }
        
        const previewSection = document.getElementById('messagePreview');
        if (previewSection) {
            previewSection.classList.add('hidden');
        }
    }

    showMessagePreview() {
        const previewSection = document.getElementById('messagePreview');
        const previewContent = document.getElementById('previewContent');
        
        if (previewSection && previewContent && this.capturedImage) {
            const imageUrl = URL.createObjectURL(this.capturedImage);
            
            previewContent.innerHTML = `
                <div class="photo-message-preview">
                    <i class="fas fa-camera fa-2x"></i>
                    <h4>Photo Message</h4>
                    <p>Handwritten Letter Captured</p>
                    <div class="photo-preview-container">
                        <img src="${imageUrl}" alt="Captured handwritten letter" class="captured-photo-preview">
                    </div>
                    <div class="photo-details">
                        <span class="photo-size">${this.formatFileSize(this.capturedImage.size)}</span>
                        <span class="photo-timestamp">${new Date().toLocaleString()}</span>
                    </div>
                </div>
            `;
            
            previewSection.classList.remove('hidden');
            
            // Scroll to preview
            previewSection.scrollIntoView({ behavior: 'smooth' });
            
            // Clean up URL after some time
            setTimeout(() => URL.revokeObjectURL(imageUrl), 10000);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getCurrentPhoto() {
        return {
            type: 'photo',
            blob: this.capturedImage,
            timestamp: new Date().toISOString(),
            size: this.capturedImage ? this.capturedImage.size : 0,
            mimeType: 'image/jpeg'
        };
    }

    discardPhoto() {
        this.capturedImage = null;
        this.hidePhotoPreview();
        this.stopCamera();
        this.updateUI();
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.isStreaming = false;
    }

    updateUI() {
        const startBtn = document.getElementById('startPhotoBtn');
        const videoElement = document.getElementById('cameraPreview');
        const controls = document.getElementById('photoControls');
        const photoCard = document.getElementById('photoCard');

        if (this.isStreaming && !this.capturedImage) {
            // Camera is streaming, show video and capture controls
            if (startBtn) startBtn.style.display = 'none';
            if (videoElement) videoElement.classList.remove('hidden');
            if (controls) controls.classList.remove('hidden');
            if (photoCard) photoCard.classList.add('camera-active');
            
        } else if (this.capturedImage) {
            // Photo captured, show retake controls
            if (startBtn) startBtn.style.display = 'none';
            if (videoElement) videoElement.classList.add('hidden');
            if (controls) controls.classList.remove('hidden');
            if (photoCard) photoCard.classList.add('photo-captured');
            
        } else {
            // Initial state
            if (startBtn) startBtn.style.display = 'block';
            if (videoElement) videoElement.classList.add('hidden');
            if (controls) controls.classList.add('hidden');
            if (photoCard) {
                photoCard.classList.remove('camera-active', 'photo-captured');
            }
        }

        // Update button text and icons
        const captureBtn = document.getElementById('captureBtn');
        const retakeBtn = document.getElementById('retakeBtn');
        
        if (this.capturedImage) {
            if (captureBtn) captureBtn.style.display = 'none';
            if (retakeBtn) retakeBtn.style.display = 'block';
        } else {
            if (captureBtn) captureBtn.style.display = 'block';
            if (retakeBtn) retakeBtn.style.display = 'none';
        }
    }

    showError(message) {
        console.error('Camera error:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'camera-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        const photoCard = document.getElementById('photoCard');
        if (photoCard) {
            photoCard.appendChild(errorDiv);
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    // Enhanced photo processing for better document capture
    enhanceDocumentPhoto() {
        if (!this.canvas || !this.context || !this.capturedImage) return;

        // Apply filters to improve document readability
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Simple contrast enhancement
        for (let i = 0; i < data.length; i += 4) {
            // Increase contrast
            data[i] = Math.max(0, Math.min(255, (data[i] - 128) * 1.2 + 128));     // Red
            data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * 1.2 + 128)); // Green
            data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * 1.2 + 128)); // Blue
        }

        this.context.putImageData(imageData, 0, 0);
        
        // Convert enhanced image back to blob
        this.canvas.toBlob((blob) => {
            this.capturedImage = blob;
        }, 'image/jpeg', 0.95);
    }

    // Cleanup method
    cleanup() {
        this.stopCamera();
    }
}

// Initialize camera when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.camera = new CameraCapture();
});