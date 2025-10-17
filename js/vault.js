class MessageVault {
    constructor() {
        this.db = null;
        this.dbName = '2FutureMeVault';
        this.dbVersion = 1;
        this.storeName = 'messages';
        this.deliveryDelayMonths = 3;
        
        this.init();
    }

    async init() {
        try {
            await this.initDatabase();
            await this.loadMessages();
            this.setupEventListeners();
            this.startDeliveryChecker();
            console.log('Vault system initialized');
        } catch (error) {
            console.error('Error initializing vault:', error);
            this.showError('Failed to initialize message vault');
        }
    }

    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create messages store
                const messageStore = db.createObjectStore(this.storeName, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Create indexes
                messageStore.createIndex('deliveryDate', 'deliveryDate', { unique: false });
                messageStore.createIndex('status', 'status', { unique: false });
                messageStore.createIndex('type', 'type', { unique: false });
                messageStore.createIndex('createdDate', 'createdDate', { unique: false });
            };
        });
    }

    setupEventListeners() {
        const saveBtn = document.getElementById('saveMessageBtn');
        const discardBtn = document.getElementById('discardBtn');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentMessage());
        }

        if (discardBtn) {
            discardBtn.addEventListener('click', () => this.discardCurrentMessage());
        }

        // Voice command integration
        window.vault = this;
    }

    async saveCurrentMessage() {
        try {
            let messageData = null;
            let messageType = null;

            // Determine if we have a voice or photo message
            if (window.recorder && window.recorder.audioBlob) {
                messageData = window.recorder.getCurrentRecording();
                messageType = 'voice';
            } else if (window.camera && window.camera.capturedImage) {
                messageData = window.camera.getCurrentPhoto();
                messageType = 'photo';
            } else {
                this.showError('No message to save');
                return;
            }

            // Get additional note
            const noteElement = document.getElementById('messageNote');
            const note = noteElement ? noteElement.value.trim() : '';

            // Calculate delivery date (3 months from now)
            const deliveryDate = new Date();
            deliveryDate.setMonth(deliveryDate.getMonth() + this.deliveryDelayMonths);

            // Create message object
            const message = {
                type: messageType,
                data: await this.blobToBase64(messageData.blob),
                mimeType: messageData.mimeType,
                note: note,
                createdDate: new Date().toISOString(),
                deliveryDate: deliveryDate.toISOString(),
                status: 'pending', // 'pending', 'delivered', 'viewed'
                duration: messageData.duration || null,
                size: messageData.size || messageData.blob.size,
                // Add preparation context if available
                preparationContext: window.preparationFlow?.answers || null
            };

            // Show storage animation before actually saving
            await this.showStorageAnimation(message);

            // Save to database
            await this.saveMessage(message);

            // Clear current message
            this.clearCurrentMessage();

            // Update UI
            await this.loadMessages();

            // Provide feedback WITHOUT revealing delivery date
            if (window.voiceRecognition) {
                window.voiceRecognition.showFeedback('Your message has been safely stored in the vault!');
            }

            this.showSuccess('Message sealed in the vault! Your future self will receive it when the time is right.');

        } catch (error) {
            console.error('Error saving message:', error);
            this.showError('Failed to save message to vault');
        }
    }

    async showStorageAnimation(message) {
        return new Promise((resolve) => {
            // Create storage animation overlay
            const overlay = document.createElement('div');
            overlay.className = 'vault-storage-overlay';
            overlay.innerHTML = `
                <div class="storage-animation-container">
                    <div class="message-preview-animation">
                        <div class="message-icon">
                            ${message.type === 'voice' ? 
                                '<svg viewBox="0 0 24 24"><path d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z" fill="currentColor"/></svg>' :
                                '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" fill="currentColor"/><circle cx="12" cy="13" r="4" fill="currentColor"/></svg>'
                            }
                        </div>
                        <div class="message-title">${message.type === 'voice' ? 'Voice Message' : 'Photo Message'}</div>
                        ${message.note ? `<div class="message-note-preview">"${message.note.substring(0, 50)}${message.note.length > 50 ? '...' : ''}"</div>` : ''}
                    </div>
                    
                    <div class="vault-door">
                        <div class="vault-door-inner">
                            <div class="vault-lock">
                                <svg viewBox="0 0 24 24">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" fill="none"/>
                                </svg>
                            </div>
                            <div class="vault-timer">
                                <div class="timer-rings">
                                    <div class="ring ring-1"></div>
                                    <div class="ring ring-2"></div>
                                    <div class="ring ring-3"></div>
                                </div>
                                <div class="timer-text">3 Months</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="storage-status">
                        <div class="status-icon">
                            <svg viewBox="0 0 24 24" class="check-icon">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="status-text">
                            <div class="main-text">Message Sealed Successfully!</div>
                            <div class="sub-text">Your future self will thank you</div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Trigger animations
            setTimeout(() => {
                overlay.classList.add('active');
            }, 100);

            // Show message floating into vault
            setTimeout(() => {
                overlay.querySelector('.message-preview-animation').classList.add('entering-vault');
            }, 1000);

            // Show vault door closing
            setTimeout(() => {
                overlay.querySelector('.vault-door').classList.add('closing');
            }, 2000);

            // Show vault locked
            setTimeout(() => {
                overlay.querySelector('.vault-door').classList.add('locked');
            }, 2500);

            // Show timer activation
            setTimeout(() => {
                overlay.querySelector('.vault-timer').classList.add('activated');
            }, 3000);

            // Show success status
            setTimeout(() => {
                overlay.querySelector('.storage-status').classList.add('visible');
            }, 3500);

            // Remove overlay and resolve
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve();
                }, 500);
            }, 5000);
        });
    }

    saveMessage(message) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(message);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to save message'));
        });
    }

    async loadMessages() {
        try {
            const messages = await this.getAllMessages();
            this.updateVaultUI(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    getAllMessages() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to load messages'));
        });
    }

    updateVaultUI(messages) {
        const now = new Date();
        const totalMessages = messages.length;
        const pendingMessages = messages.filter(m => new Date(m.deliveryDate) > now).length;
        const readyMessages = messages.filter(m => new Date(m.deliveryDate) <= now && m.status !== 'viewed').length;

        // Update stats
        const totalElement = document.getElementById('totalMessages');
        const pendingElement = document.getElementById('pendingMessages');
        const readyElement = document.getElementById('readyMessages');

        if (totalElement) totalElement.textContent = totalMessages;
        if (pendingElement) pendingElement.textContent = pendingMessages;
        if (readyElement) readyElement.textContent = readyMessages;

        // Update messages list
        this.updateMessagesList(messages);
    }

    updateMessagesList(messages) {
        const messagesContainer = document.getElementById('vaultMessages');
        if (!messagesContainer) return;

        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-vault">
                    <div class="empty-icon">
                        <svg viewBox="0 0 24 24" class="icon">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </div>
                    <h3>Your vault is empty</h3>
                    <p>Create your first message to your future self above!</p>
                </div>
            `;
            return;
        }

        const now = new Date();
        
        // Sort messages by creation date (newest first) instead of delivery date
        messages.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

        messagesContainer.innerHTML = messages.map(message => {
            const deliveryDate = new Date(message.deliveryDate);
            const createdDate = new Date(message.createdDate);
            const isReady = deliveryDate <= now;
            
            return `
                <div class="vault-message ${isReady ? 'ready' : 'sealed'} ${message.status}" data-id="${message.id}">
                    <div class="message-card">
                        <div class="message-header">
                            <div class="message-icon">
                                <svg viewBox="0 0 24 24" class="icon">
                                    ${message.type === 'voice' ? 
                                        '<path d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2Z" fill="currentColor"/>' :
                                        '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" fill="currentColor"/><circle cx="12" cy="13" r="4" fill="currentColor"/>'
                                    }
                                </svg>
                            </div>
                            <div class="message-info">
                                <h4>${message.type === 'voice' ? 'Voice Message' : 'Photo Message'}</h4>
                                <p class="creation-date">${createdDate.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</p>
                            </div>
                            <div class="message-status">
                                ${isReady ? 
                                    '<div class="status-badge ready"><span class="status-dot"></span>Ready</div>' : 
                                    '<div class="status-badge sealed"><span class="status-dot"></span>Sealed</div>'
                                }
                            </div>
                        </div>
                        
                        ${message.note ? `
                            <div class="message-preview">
                                <p class="note-preview">"${message.note.length > 100 ? message.note.substring(0, 100) + '...' : message.note}"</p>
                            </div>
                        ` : ''}
                        
                        <div class="message-vault-info">
                            ${isReady ? `
                                <div class="ready-message">
                                    <div class="ready-icon">✨</div>
                                    <div class="ready-text">
                                        <strong>Your message has arrived!</strong>
                                        <small>Your past self left this for you</small>
                                    </div>
                                </div>
                            ` : `
                                <div class="sealed-message">
                                    <div class="vault-lock-icon">
                                        <svg viewBox="0 0 24 24" class="icon">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor"/>
                                            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" fill="none"/>
                                        </svg>
                                    </div>
                                    <div class="sealed-text">
                                        <strong>Safely sealed in the vault</strong>
                                        <small>Will return when the time is right</small>
                                    </div>
                                </div>
                            `}
                        </div>
                        
                        <div class="message-actions">
                            ${isReady ? `
                                <button class="btn btn-primary" onclick="vault.viewMessage(${message.id})">
                                    <svg viewBox="0 0 24 24" class="icon">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" fill="none"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" fill="none"/>
                                    </svg>
                                    Open Message
                                </button>
                            ` : `
                                <div class="sealed-actions">
                                    <div class="patience-message">
                                        <svg viewBox="0 0 24 24" class="icon">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"/>
                                            <polyline points="12,6 12,12 16,14" stroke="currentColor" fill="none"/>
                                        </svg>
                                        <span>Good things come to those who wait</span>
                                    </div>
                                </div>
                            `}
                            <button class="btn btn-danger btn-sm" onclick="vault.confirmDelete(${message.id})">
                                <svg viewBox="0 0 24 24" class="icon">
                                    <polyline points="3,6 5,6 21,6" stroke="currentColor" fill="none"/>
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" fill="none"/>
                                </svg>
                                ${isReady ? 'Delete' : 'Destroy'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    confirmDelete(messageId) {
        const overlay = document.createElement('div');
        overlay.className = 'delete-confirmation-overlay';
        overlay.innerHTML = `
            <div class="delete-confirmation-modal">
                <div class="confirmation-icon">
                    <svg viewBox="0 0 24 24" class="icon">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor"/>
                    </svg>
                </div>
                <h3>Are you sure?</h3>
                <p>This will permanently destroy your message to your future self. This action cannot be undone.</p>
                <div class="confirmation-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.delete-confirmation-overlay').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-danger" onclick="vault.deleteMessage(${messageId}); this.closest('.delete-confirmation-overlay').remove();">
                        <svg viewBox="0 0 24 24" class="icon">
                            <polyline points="3,6 5,6 21,6" stroke="currentColor" fill="none"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" fill="none"/>
                        </svg>
                        Yes, Destroy Message
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Trigger animation
        setTimeout(() => overlay.classList.add('active'), 100);
    }

    async viewMessage(messageId) {
        try {
            const message = await this.getMessage(messageId);
            if (!message) {
                this.showError('Message not found');
                return;
            }

            const now = new Date();
            const deliveryDate = new Date(message.deliveryDate);
            
            if (deliveryDate > now) {
                this.showError('This message is not ready for viewing yet');
                return;
            }

            // Create modal to display message
            this.showMessageModal(message);

            // Mark as viewed
            await this.updateMessageStatus(messageId, 'viewed');
            await this.loadMessages();

        } catch (error) {
            console.error('Error viewing message:', error);
            this.showError('Failed to view message');
        }
    }

    showMessageModal(message) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'message-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Your Message from ${new Date(message.createdDate).toLocaleDateString()}</h3>
                    <button class="close-modal" onclick="this.closest('.message-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.renderMessageContent(message)}
                    ${message.note ? `<div class="message-note-display"><strong>Your note:</strong> "${message.note}"</div>` : ''}
                </div>
                <div class="modal-footer">
                    <button class="close-btn" onclick="this.closest('.message-modal').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    renderMessageContent(message) {
        if (message.type === 'voice') {
            const audioData = `data:${message.mimeType};base64,${message.data}`;
            return `
                <div class="voice-message-content">
                    <i class="fas fa-microphone fa-3x"></i>
                    <h4>Your Voice Message</h4>
                    <audio controls>
                        <source src="${audioData}" type="${message.mimeType}">
                        Your browser does not support audio playback.
                    </audio>
                    <p>Duration: ${message.duration}</p>
                </div>
            `;
        } else if (message.type === 'photo') {
            const imageData = `data:${message.mimeType};base64,${message.data}`;
            return `
                <div class="photo-message-content">
                    <h4>Your Handwritten Letter</h4>
                    <img src="${imageData}" alt="Your handwritten letter" class="message-photo">
                </div>
            `;
        }
        return '<p>Unknown message type</p>';
    }

    async deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            return;
        }

        try {
            await this.removeMessage(messageId);
            await this.loadMessages();
            this.showSuccess('Message deleted successfully');
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showError('Failed to delete message');
        }
    }

    getMessage(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get message'));
        });
    }

    updateMessageStatus(id, status) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (message) {
                    message.status = status;
                    const updateRequest = store.put(message);
                    updateRequest.onsuccess = () => resolve();
                    updateRequest.onerror = () => reject(new Error('Failed to update message status'));
                } else {
                    reject(new Error('Message not found'));
                }
            };

            getRequest.onerror = () => reject(new Error('Failed to get message for update'));
        });
    }

    removeMessage(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete message'));
        });
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    getTimeUntilDelivery(deliveryDate) {
        const now = new Date();
        const diff = deliveryDate - now;
        
        if (diff <= 0) return 'Available now!';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }

    startDeliveryChecker() {
        // Check for ready messages every hour
        setInterval(() => {
            this.loadMessages();
        }, 60 * 60 * 1000);

        // Initial check
        this.loadMessages();
    }

    clearCurrentMessage() {
        // Clear voice recording
        if (window.recorder) {
            window.recorder.discardRecording();
        }

        // Clear photo
        if (window.camera) {
            window.camera.discardPhoto();
        }

        // Clear note
        const noteElement = document.getElementById('messageNote');
        if (noteElement) {
            noteElement.value = '';
        }

        // Hide preview
        const previewSection = document.getElementById('messagePreview');
        if (previewSection) {
            previewSection.classList.add('hidden');
        }
    }

    discardCurrentMessage() {
        if (confirm('Are you sure you want to discard this message?')) {
            this.clearCurrentMessage();
            if (window.voiceRecognition) {
                window.voiceRecognition.showFeedback('Message discarded');
            }
        }
    }

    showError(message) {
        console.error('Vault error:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'vault-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'vault-success';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
    }
}

// Initialize vault when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.vault = new MessageVault();
});