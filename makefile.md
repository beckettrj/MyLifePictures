# MyLifePictures.ai - Development Makefile

This makefile provides convenient commands for development, testing, and deployment of MyLifePictures.ai.

## 📋 Available Commands

### Development Commands

#### `make install`
**Description**: Install all project dependencies and set up development environment
```bash
# Install Node.js dependencies
npm install

# Copy environment template if .env doesn't exist
cp .env.example .env

# Display setup instructions
echo "✅ Dependencies installed!"
echo "📝 Please configure your .env file with:"
echo "   - Supabase URL and API key"
echo "   - At least one AI provider API key"
echo "   - Run 'make dev' to start development server"
```

#### `make dev`
**Description**: Start the development server with hot reload
```bash
# Start Vite development server
npm run dev

# Server will be available at http://localhost:5173
# Hot reload enabled for instant feedback
```

#### `make build`
**Description**: Build the application for production
```bash
# Clean previous build
rm -rf dist

# Build optimized production bundle
npm run build

# Display build information
echo "🚀 Production build complete!"
echo "📁 Files available in ./dist directory"
echo "📊 Build size analysis available"
```

#### `make preview`
**Description**: Preview the production build locally
```bash
# Build the application first
make build

# Start preview server
npm run preview

# Available at http://localhost:4173
```

### Testing Commands

#### `make test`
**Description**: Run all tests with coverage reporting
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Display test results summary
echo "✅ All tests completed!"
```

#### `make test-watch`
**Description**: Run tests in watch mode for development
```bash
# Start test watcher
npm run test:watch

# Tests will re-run automatically on file changes
```

#### `make lint`
**Description**: Run code linting and formatting checks
```bash
# Run ESLint
npm run lint

# Check TypeScript types
npm run type-check

# Check Prettier formatting
npm run format:check

echo "🔍 Code quality checks complete!"
```

#### `make lint-fix`
**Description**: Automatically fix linting and formatting issues
```bash
# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

echo "🔧 Code formatting applied!"
```

### Database Commands

#### `make db-setup`
**Description**: Set up Supabase database with required tables and policies
```bash
# Check if Supabase is configured
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ Please configure VITE_SUPABASE_URL in .env file"
  exit 1
fi

# Run database migrations
echo "🗄️ Setting up database schema..."
echo "📝 Creating tables: users, photos, photo_folders, audio_recordings"
echo "🔒 Enabling Row Level Security (RLS)"
echo "✅ Database setup complete!"

# Note: Actual migration files are in /supabase/migrations/
```

#### `make db-reset`
**Description**: Reset database to clean state (⚠️ DESTRUCTIVE)
```bash
echo "⚠️  WARNING: This will delete ALL data!"
read -p "Are you sure? (y/N): " confirm

if [ "$confirm" = "y" ]; then
  echo "🗑️ Resetting database..."
  echo "📝 Dropping all tables"
  echo "🔄 Recreating schema"
  echo "✅ Database reset complete!"
else
  echo "❌ Database reset cancelled"
fi
```

#### `make db-seed`
**Description**: Seed database with sample data for development
```bash
# Create demo user
echo "👤 Creating demo user..."

# Upload sample photos
echo "📸 Uploading sample photos..."

# Create sample folders
echo "📁 Creating photo folders..."

# Add sample annotations
echo "🎤 Adding voice annotations..."

echo "✅ Database seeded with sample data!"
echo "🔑 Demo login: demo@mylifepictures.ai / demo123"
```

### Deployment Commands

#### `make deploy-staging`
**Description**: Deploy to staging environment
```bash
# Build production bundle
make build

# Deploy to Netlify staging
echo "🚀 Deploying to staging..."
echo "🔗 Staging URL: https://staging--mylifepictures.netlify.app"

# Run post-deployment tests
make test-e2e

echo "✅ Staging deployment complete!"
```

#### `make deploy-production`
**Description**: Deploy to production environment
```bash
# Verify all tests pass
make test

# Build production bundle
make build

# Deploy to production
echo "🚀 Deploying to production..."
echo "🔗 Production URL: https://mylifepictures.ai"

# Verify deployment
echo "✅ Production deployment complete!"
echo "📊 Monitor at: https://app.netlify.com"
```

### Maintenance Commands

#### `make clean`
**Description**: Clean all generated files and caches
```bash
# Remove build artifacts
rm -rf dist
rm -rf .vite

# Clear npm cache
npm cache clean --force

# Remove node_modules (optional)
read -p "Remove node_modules? (y/N): " confirm
if [ "$confirm" = "y" ]; then
  rm -rf node_modules
  echo "📦 Run 'make install' to reinstall dependencies"
fi

echo "🧹 Cleanup complete!"
```

#### `make update`
**Description**: Update all dependencies to latest versions
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Audit for security vulnerabilities
npm audit

# Fix vulnerabilities if found
npm audit fix

echo "📦 Dependencies updated!"
echo "🔍 Run 'make test' to verify compatibility"
```

#### `make doctor`
**Description**: Run comprehensive health check
```bash
echo "🏥 Running system health check..."

# Check Node.js version
node --version

# Check npm version
npm --version

# Verify environment variables
echo "🔧 Checking environment configuration..."

# Test database connection
echo "🗄️ Testing database connection..."

# Test AI provider connections
echo "🤖 Testing AI provider APIs..."

# Check build process
echo "🔨 Testing build process..."
make build > /dev/null 2>&1

# Run test suite
echo "🧪 Running test suite..."
make test > /dev/null 2>&1

echo "✅ Health check complete!"
```

### AI & Voice Commands

#### `make test-voice`
**Description**: Test voice recognition and AI integration
```bash
echo "🎤 Testing voice recognition..."

# Check browser compatibility
echo "🌐 Checking Web Speech API support"

# Test AI provider connections
echo "🤖 Testing OpenAI connection..."
echo "🧠 Testing Anthropic connection..."
echo "✨ Testing Gemini connection..."

# Verify voice commands
echo "🗣️ Voice command test complete!"
echo "💡 Say 'Hey Sunny' to test wake word"
```

#### `make ai-validate`
**Description**: Validate all AI provider API keys
```bash
echo "🔑 Validating AI provider API keys..."

# Test OpenAI
if [ -n "$VITE_OPENAI_API_KEY" ]; then
  echo "✅ OpenAI key configured"
else
  echo "❌ OpenAI key missing"
fi

# Test Anthropic
if [ -n "$VITE_ANTHROPIC_API_KEY" ]; then
  echo "✅ Anthropic key configured"
else
  echo "❌ Anthropic key missing"
fi

# Test Gemini
if [ -n "$VITE_GEMINI_API_KEY" ]; then
  echo "✅ Gemini key configured"
else
  echo "❌ Gemini key missing"
fi

echo "🎯 AI validation complete!"
```

### Documentation Commands

#### `make docs`
**Description**: Generate and serve documentation
```bash
# Generate API documentation
echo "📚 Generating API documentation..."

# Generate component documentation
echo "🧩 Generating component docs..."

# Serve documentation locally
echo "🌐 Documentation available at http://localhost:3000"
echo "📖 Includes setup guides, API reference, and examples"
```

#### `make docs-deploy`
**Description**: Deploy documentation to GitHub Pages
```bash
# Build documentation
make docs

# Deploy to GitHub Pages
echo "🚀 Deploying documentation..."
echo "🔗 Available at: https://your-username.github.io/mylifepictures-ai"
```

## 🎯 Quick Start Workflow

For new developers:
```bash
# 1. Initial setup
make install

# 2. Configure environment
# Edit .env file with your credentials

# 3. Set up database
make db-setup

# 4. Start development
make dev

# 5. Run tests
make test
```

For daily development:
```bash
# Start development server
make dev

# In another terminal, run tests in watch mode
make test-watch

# Before committing
make lint
make test
```

For deployment:
```bash
# Deploy to staging
make deploy-staging

# After testing, deploy to production
make deploy-production
```

## 🔧 Environment Requirements

### Required Environment Variables
```bash
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Providers (At least one required)
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### System Requirements
- Node.js 18+ and npm 8+
- Modern browser with Web Speech API support
- Microphone for voice commands
- 2GB+ RAM for development
- 10GB+ disk space for dependencies

## 📞 Support

If you encounter issues with any make commands:

1. **Check Prerequisites**: Ensure all required tools are installed
2. **Verify Environment**: Check that .env file is properly configured
3. **Clear Cache**: Run `make clean` and try again
4. **Check Logs**: Look for error messages in terminal output
5. **Get Help**: Contact support@mylifepictures.ai

---

**Happy coding! 🚀 These commands will help you build an amazing AI-powered slideshow experience for elderly users.**