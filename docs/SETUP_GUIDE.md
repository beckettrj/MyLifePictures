# MyLifePictures.ai Setup Guide 🚀

This comprehensive guide will help you set up MyLifePictures.ai from scratch, whether you're a developer, family member, or caregiver.

## 📋 Prerequisites

### System Requirements
- **Computer**: Windows 10+, macOS 10.15+, or Linux
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Internet**: Stable connection for initial setup and AI features
- **Microphone**: Required for voice commands
- **Storage**: 500MB free space for local photos

### Account Requirements
- Email address for account creation
- At least one AI provider API key (free tiers available)
- Supabase account (free tier sufficient for personal use)

---

## 🎯 Quick Setup (5 Minutes)

### For Families & Caregivers

1. **Visit the Application**
   ```
   https://mylifepictures.ai
   ```

2. **Create Account**
   - Click "Sign Up"
   - Enter email and password
   - Add full name for personalization

3. **Connect to Supabase**
   - Click "Connect to Supabase" button
   - Follow the guided setup process

4. **Configure AI Assistant**
   - Choose "OpenAI" for best results
   - Get free API key from [OpenAI](https://platform.openai.com/api-keys)
   - Paste key and click "Validate"

5. **Upload Photos**
   - Drag and drop family photos
   - Create folders like "Family", "Holidays"
   - Add descriptions for better AI understanding

6. **Start Slideshow**
   - Click "Start Slideshow"
   - Say "Hey Sunny" to activate voice commands
   - Enjoy your personalized photo experience!

---

## 🛠️ Developer Setup

### 1. Project Setup
The project is already configured and ready to use in your development environment.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your credentials
nano .env
```

### 4. Supabase Setup

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be ready (2-3 minutes)

#### Get Supabase Credentials
1. Go to Project Settings → API
2. Copy "Project URL" and "anon public" key
3. Add to `.env` file:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

#### Database Schema
The database schema will be created automatically when you first run the application. Tables include:
- `users` - User profiles and preferences
- `photo_folders` - Photo organization
- `photos` - Photo metadata and annotations
- `audio_recordings` - Voice annotations

### 5. AI Provider Setup

#### OpenAI (Recommended)
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create account if needed
3. Click "Create new secret key"
4. Copy key and add to `.env`:
   ```bash
   VITE_OPENAI_API_KEY=sk-...
   ```

#### Anthropic Claude (Optional)
1. Visit [Anthropic Console](https://console.anthropic.com/account/keys)
2. Create account and verify email
3. Generate API key
4. Add to `.env`:
   ```bash
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```

#### Google Gemini (Optional)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create API key
4. Add to `.env`:
   ```bash
   VITE_GEMINI_API_KEY=AI...
   ```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 🔧 Configuration Options

### AI Assistant Settings
```javascript
// Default assistant name
VITE_DEFAULT_AI_NAME=Sunny

// Wake word for voice activation
VITE_DEFAULT_WAKE_WORD=Hey Sunny

// Voice activation mode
// Options: 'push-to-talk', 'wake-word', 'always-on'
VITE_VOICE_ACTIVATION_MODE=wake-word
```

### Accessibility Settings
```javascript
// Enable high contrast mode by default
VITE_DEFAULT_HIGH_CONTRAST=false

// Default font size
// Options: 'small', 'medium', 'large', 'xl'
VITE_DEFAULT_FONT_SIZE=large

// Enable reduced motion for sensitive users
VITE_REDUCED_MOTION=false
```

### Feature Flags
```javascript
// Enable voice commands
VITE_ENABLE_VOICE_COMMANDS=true

// Enable coaxing mode (AI asks about photos)
VITE_ENABLE_COAXING_MODE=true

// Enable emergency detection
VITE_ENABLE_EMERGENCY_DETECTION=true

// Enable offline mode
VITE_ENABLE_OFFLINE_MODE=true
```

---

## 📱 Mobile & Tablet Setup

### iOS Setup
1. Open Safari on iPad/iPhone
2. Navigate to your MyLifePictures.ai URL
3. Tap Share button → "Add to Home Screen"
4. App will work like a native application

### Android Setup
1. Open Chrome on Android device
2. Navigate to your MyLifePictures.ai URL
3. Tap menu (three dots) → "Add to Home screen"
4. App will install as PWA (Progressive Web App)

### Tablet Optimization
- Interface automatically adapts to tablet screen sizes
- Touch targets are optimized for finger navigation
- Voice commands work with built-in microphones

---

## 🏥 Care Facility Setup

### Network Requirements
- Stable WiFi with 10+ Mbps download speed
- Firewall exceptions for:
  - `*.supabase.co` (database)
  - `api.openai.com` (AI services)
  - `*.googleapis.com` (Google services)

### Device Recommendations
- **Tablets**: iPad (9th gen+) or Samsung Galaxy Tab A8+
- **Computers**: Any modern laptop/desktop with microphone
- **Displays**: 24"+ monitors for better visibility
- **Audio**: External speakers for better voice feedback

### Staff Training
1. **Basic Operation**
   - How to start/stop slideshow
   - Voice command basics
   - Emergency procedures

2. **Photo Management**
   - Uploading family photos
   - Creating folders
   - Adding descriptions

3. **Troubleshooting**
   - Voice recognition issues
   - Network connectivity
   - AI service outages

### Privacy & Compliance
- All data encrypted in transit and at rest
- HIPAA-compliant infrastructure (Supabase)
- User data isolation and access controls
- Audit logging for compliance reporting

---

## 🔍 Troubleshooting

### Common Issues

#### Voice Commands Not Working
```bash
# Check microphone permissions
1. Browser settings → Privacy → Microphone
2. Allow access for your domain
3. Test with "Hey Sunny, next picture"

# Check browser compatibility
- Chrome/Edge: Full support
- Firefox: Limited speech synthesis
- Safari: iOS 14.5+ required
```

#### AI Responses Slow/Failing
```bash
# Check API key validity
1. Go to Settings → AI Setup
2. Click "Validate" next to each provider
3. Green checkmark = working
4. Red X = check API key and billing

# Check network connectivity
1. Open browser developer tools
2. Network tab → look for failed requests
3. Check firewall/proxy settings
```

#### Photos Not Uploading
```bash
# Check file formats
- Supported: JPEG, PNG, GIF, WebP, BMP
- Max size: 10MB per file
- Check browser console for errors

# Check Supabase storage
1. Supabase dashboard → Storage
2. Verify bucket exists and is public
3. Check storage quota (1GB free tier)
```

#### Database Connection Issues
```bash
# Verify Supabase credentials
1. Check .env file for correct URL/key
2. Supabase dashboard → Settings → API
3. Regenerate keys if needed

# Check RLS policies
1. Supabase dashboard → Authentication
2. Verify user is authenticated
3. Check table policies in SQL editor
```

### Performance Optimization

#### Slow Photo Loading
```javascript
// Optimize image sizes
- Resize large photos to 1920x1080 max
- Use JPEG for photos, PNG for graphics
- Enable Supabase image transformations

// Browser caching
- Photos cached automatically
- Clear cache if seeing old versions
- Use incognito mode for testing
```

#### Voice Recognition Accuracy
```javascript
// Improve recognition
- Speak clearly and slowly
- Reduce background noise
- Use external microphone if available
- Train voice commands with family

// Adjust sensitivity
- Settings → Voice → Sensitivity
- Test different wake word variations
- Consider push-to-talk for noisy environments
```

---

## 📊 Monitoring & Analytics

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Database connectivity
- Supabase dashboard → Logs
- Check for connection errors
- Monitor query performance

# AI service status
- OpenAI status: https://status.openai.com
- Anthropic status: https://status.anthropic.com
- Google status: https://status.cloud.google.com
```

### Usage Analytics
```javascript
// Built-in metrics
- Photo view counts
- Voice command usage
- AI interaction frequency
- Error rates and types

// Custom tracking
- Family engagement metrics
- Favorite photo patterns
- Voice command success rates
- Emergency alert frequency
```

---

## 🚀 Production Deployment

### Netlify Deployment
```bash
# Build for production
npm run build

# Deploy to Netlify
1. Connect your project repository
2. Set build command: npm run build
3. Set publish directory: dist
4. Add environment variables
5. Deploy!
```

### Custom Domain Setup
```bash
# DNS Configuration
1. Add CNAME record: www → netlify-domain
2. Add A record: @ → Netlify IP
3. Enable HTTPS in Netlify dashboard
4. Update Supabase allowed origins
```

### Environment Variables (Production)
```bash
# Supabase (Production)
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key

# AI Providers (Production keys with higher limits)
VITE_OPENAI_API_KEY=sk-prod-...
VITE_ANTHROPIC_API_KEY=sk-ant-prod-...
VITE_GEMINI_API_KEY=AI-prod-...

# Security
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

---

## 📞 Support Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Voice Commands](./VOICE_COMMANDS.md)
- [Accessibility Guide](./ACCESSIBILITY.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Community
- Project discussions for technical questions
- Real-time help and support
- Video tutorials and guides
- Email support: support@mylifepictures.ai

### Professional Support
- Setup assistance for care facilities
- Custom training for staff
- Priority technical support
- HIPAA compliance consultation

---

## ✅ Setup Checklist

### Initial Setup
- [ ] Supabase project created and configured
- [ ] At least one AI provider API key added
- [ ] Environment variables configured
- [ ] Application running locally
- [ ] Voice commands tested and working

### Photo Management
- [ ] Sample photos uploaded
- [ ] Folders created and organized
- [ ] Photo descriptions added
- [ ] Slideshow tested with transitions

### AI Configuration
- [ ] AI assistant name customized
- [ ] Wake word configured
- [ ] Voice commands tested
- [ ] Emergency detection verified

### Accessibility
- [ ] Font size adjusted for user
- [ ] High contrast mode tested
- [ ] Voice feedback volume adjusted
- [ ] Touch targets verified for tablets

### Production Ready
- [ ] Domain configured
- [ ] HTTPS enabled
- [ ] Production API keys added
- [ ] Monitoring setup
- [ ] Backup procedures documented

---

**Congratulations! 🎉 Your MyLifePictures.ai setup is complete. Your elderly users can now enjoy a personalized, voice-controlled photo experience that brings families closer together.**

For additional help, visit our support center or contact us directly.