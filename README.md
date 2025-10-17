# 2FutureMe - Voice Controlled Messages to Your Future Self

A completely voice-controlled web application that allows you to record voice messages or capture photos of handwritten letters, which will be delivered back to you after 3 months.

## 🎯 Features

### Core Functionality
- **Voice Recording**: Record high-quality voice messages
- **Photo Capture**: Take photos of handwritten letters with document enhancement
- **3-Month Vault**: Messages are automatically scheduled for delivery 3 months later
- **Complete Voice Control**: Navigate and operate the entire app using voice commands
- **Multi-Language Support**: English, Spanish, French, and German voice commands

### Voice Commands

#### Navigation
- "Start Listening" - Activate voice recognition
- "Stop Listening" - Deactivate voice recognition
- "Go back" - Navigate to previous section
- "Next" - Move to next section
- "Home" - Return to main screen
- "Show vault" - Display your message vault

#### Recording & Capture
- "Start recording" - Begin voice message recording
- "Stop recording" - End voice message recording
- "Take photo" - Activate camera for handwritten letter capture
- "Save message" - Store current message in vault
- "Discard" - Delete current message

#### Language Control
- "Change language to [language]" - Switch interface language
- "English" / "Spanish" / "French" / "German" - Quick language switching

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Microphone access for voice recording and commands
- Camera access for photo capture
- JavaScript enabled

### Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Allow microphone and camera permissions when prompted

### Browser Compatibility
- ✅ Chrome 60+ (Recommended)
- ✅ Firefox 55+
- ✅ Safari 14+
- ✅ Edge 79+
- ❌ Internet Explorer (Not supported)

## 📱 How to Use

### 1. Initial Setup
1. Open the app in your browser
2. Click "Allow" when prompted for microphone access
3. Click "Allow" when prompted for camera access
4. Say "Start Listening" to activate voice commands

### 2. Language Selection
- Click on your preferred language or say "Change language to [language]"
- All voice commands will work in your selected language

### 3. Creating Voice Messages
1. Say "Start recording" or click the "Start Recording" button
2. Speak your message to your future self
3. Say "Stop recording" when finished
4. Add an optional note if desired
5. Say "Save message" to store it in your vault

### 4. Capturing Handwritten Letters
1. Say "Take photo" or click "Take Photo"
2. Position your handwritten letter in the camera view
3. Say "Capture" or click the capture button
4. Review and retake if needed
5. Add an optional note
6. Say "Save message" to store it in your vault

### 5. Managing Your Vault
- View your vault statistics (total, pending, ready messages)
- See countdown timers for pending messages
- View ready messages immediately
- Delete unwanted messages

## 🏗️ Technical Architecture

### Frontend Technologies
- **HTML5**: Semantic structure with accessibility features
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: No external dependencies for core functionality

### APIs Used
- **Web Speech API**: Voice recognition for commands
- **MediaRecorder API**: High-quality audio recording
- **MediaDevices API**: Camera access for photo capture
- **IndexedDB**: Local storage for message vault
- **Canvas API**: Image processing and enhancement

### File Structure
```
2futureme/
├── index.html              # Main application file
├── css/
│   └── style.css           # Comprehensive styling
├── js/
│   ├── app.js              # Main application controller
│   ├── voice-recognition.js # Voice command processing
│   ├── recording.js        # Audio recording functionality
│   ├── camera.js           # Photo capture and processing
│   └── vault.js            # Message storage and delivery
├── assets/                 # Static assets (if any)
└── README.md              # This file
```

## 🔧 Advanced Features

### Voice Recognition
- Continuous listening mode
- Multi-language command recognition
- Fuzzy matching for partial commands
- Confidence threshold filtering
- Real-time feedback

### Audio Recording
- High-quality audio recording (44.1kHz)
- Multiple format support (WebM, OGG, MP4)
- Real-time recording timer
- Pause/resume functionality
- Audio playback preview

### Photo Capture
- Document-optimized camera settings
- Image enhancement for handwritten text
- Multiple resolution support
- Preview and retake functionality
- JPEG compression optimization

### Message Vault
- Secure local storage using IndexedDB
- 3-month delivery scheduling
- Message status tracking
- Automatic delivery notifications
- Search and filter capabilities

## 🌍 Multi-Language Support

### Supported Languages
- **English (en-US)**: Full feature support
- **Spanish (es-ES)**: Complete voice command set
- **French (fr-FR)**: All features available
- **German (de-DE)**: Full functionality

### Adding New Languages
To add support for additional languages:

1. Edit `js/voice-recognition.js`
2. Add new language object to the `commands` dictionary
3. Translate all voice commands
4. Update language selection UI in `index.html`
5. Add language button in CSS

## 🔒 Privacy & Security

### Data Storage
- All messages stored locally in your browser
- No data sent to external servers
- IndexedDB provides secure local storage
- Messages automatically encrypted by browser

### Permissions
- Microphone: Required for voice recording and commands
- Camera: Required for photo capture
- Local Storage: Required for message vault

### Privacy Considerations
- No analytics or tracking
- No external API calls
- No user data collection
- Completely offline operation

## 🧪 Testing

### Manual Testing Checklist

#### Voice Recognition
- [ ] "Start Listening" activates voice recognition
- [ ] "Stop Listening" deactivates voice recognition
- [ ] Navigation commands work ("Go back", "Next", "Home")
- [ ] Recording commands work ("Start recording", "Stop recording")
- [ ] Photo commands work ("Take photo")
- [ ] Language switching works in all supported languages

#### Voice Recording
- [ ] High-quality audio recording
- [ ] Timer displays correctly
- [ ] Pause/resume functionality
- [ ] Audio playback preview works
- [ ] Recording can be saved to vault

#### Photo Capture
- [ ] Camera access works
- [ ] Photo capture produces clear images
- [ ] Retake functionality works
- [ ] Photo preview displays correctly
- [ ] Photos can be saved to vault

#### Message Vault
- [ ] Messages save correctly with 3-month delivery date
- [ ] Vault statistics update properly
- [ ] Ready messages can be viewed
- [ ] Message deletion works
- [ ] Countdown timers are accurate

#### Multi-Language
- [ ] All languages switch correctly
- [ ] Voice commands work in each language
- [ ] UI updates appropriately

### Automated Testing
```bash
# Install a local server for testing
npx http-server .

# Open in browser
open http://localhost:8080
```

### Browser Testing
Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing
- iOS Safari
- Android Chrome
- Responsive design verification

## 🐛 Troubleshooting

### Common Issues

#### Voice Recognition Not Working
1. Check browser compatibility (Chrome/Firefox recommended)
2. Ensure microphone permissions are granted
3. Check if HTTPS is enabled (required for many browsers)
4. Try refreshing the page and allowing permissions again

#### Camera Not Working
1. Ensure camera permissions are granted
2. Check if camera is being used by another application
3. Try a different browser
4. Check browser console for error messages

#### Messages Not Saving
1. Check if IndexedDB is supported and enabled
2. Ensure sufficient storage space
3. Check browser console for errors
4. Try clearing browser cache and reloading

#### Audio Recording Issues
1. Check microphone permissions
2. Test microphone in other applications
3. Try a different browser
4. Check if MediaRecorder API is supported

### Error Messages
- "Speech recognition not supported": Use Chrome or Firefox
- "Microphone access denied": Grant microphone permissions
- "Camera access denied": Grant camera permissions
- "Failed to save message": Check storage space and browser support

## 🛣️ Roadmap

### Planned Features
- [ ] Export messages to external formats
- [ ] Email delivery option (optional)
- [ ] Advanced audio editing
- [ ] Photo text recognition (OCR)
- [ ] Message scheduling customization
- [ ] Cloud backup option
- [ ] PWA (Progressive Web App) support
- [ ] Offline functionality
- [ ] Message categories and tags

### Future Enhancements
- Voice training for better recognition
- Custom delivery schedules
- Message collaboration features
- Advanced photo filters
- Voice effects and filters

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Use vanilla JavaScript (no frameworks)
- Maintain accessibility standards
- Support all target browsers
- Follow existing code style
- Include comprehensive testing

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Web Speech API documentation and examples
- MediaRecorder API community resources
- IndexedDB tutorials and best practices
- Voice command UX research and patterns
- Accessibility guidelines for voice interfaces

---

**Built with ❤️ for personal reflection and future memories**

*Create meaningful messages to your future self through the power of voice and technology.*