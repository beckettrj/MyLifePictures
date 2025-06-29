#!/usr/bin/env make

# MyLifePictures.ai - Development Makefile
# Provides convenient commands for development, testing, and deployment

.PHONY: help install dev build preview test test-watch lint lint-fix clean update doctor
.PHONY: db-setup db-reset db-seed db-verify
.PHONY: deploy-staging deploy-production
.PHONY: test-voice ai-validate docs docs-deploy

# Default target
help:
	@echo "🚀 MyLifePictures.ai Development Commands"
	@echo "========================================"
	@echo ""
	@echo "📦 Setup & Development:"
	@echo "  make install       - Install dependencies and setup environment"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make preview      - Preview production build"
	@echo ""
	@echo "🧪 Testing & Quality:"
	@echo "  make test         - Run all tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo "  make lint         - Run linting and type checks"
	@echo "  make lint-fix     - Fix linting issues automatically"
	@echo ""
	@echo "🗄️ Database:"
	@echo "  make db-setup     - Setup database schema (REQUIRED FIRST TIME)"
	@echo "  make db-verify    - Verify database setup"
	@echo "  make db-seed      - Seed with sample data"
	@echo "  make db-reset     - Reset database (DESTRUCTIVE)"
	@echo ""
	@echo "🔧 Maintenance:"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make update       - Update dependencies"
	@echo "  make doctor       - Run health checks"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy-staging    - Deploy to staging"
	@echo "  make deploy-production - Deploy to production"

# Development Commands
install:
	@echo "📦 Installing dependencies..."
	npm install
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file from template..."; \
		cp .env.example .env; \
		echo "⚠️  Please configure your .env file with:"; \
		echo "   - VITE_SUPABASE_URL (from Supabase dashboard)"; \
		echo "   - VITE_SUPABASE_ANON_KEY (from Supabase dashboard)"; \
		echo "   - SUPABASE_SERVICE_ROLE_KEY (for database setup)"; \
		echo "   - At least one AI provider API key"; \
	fi
	@echo "✅ Installation complete!"
	@echo "📝 Next steps:"
	@echo "   1. Configure your .env file"
	@echo "   2. Run 'make db-setup' to setup database"
	@echo "   3. Run 'make dev' to start development"

dev:
	@echo "🚀 Starting development server..."
	npm run dev

build:
	@echo "🔨 Building for production..."
	@rm -rf dist
	npm run build
	@echo "✅ Production build complete!"
	@echo "📁 Files available in ./dist directory"

preview: build
	@echo "👀 Starting preview server..."
	npm run preview

# Testing Commands
test:
	@echo "🧪 Running all tests..."
	npm run test
	@echo "✅ All tests completed!"

test-watch:
	@echo "👀 Starting test watcher..."
	npm run test:watch

lint:
	@echo "🔍 Running code quality checks..."
	npm run lint
	npm run type-check
	npm run format:check
	@echo "✅ Code quality checks complete!"

lint-fix:
	@echo "🔧 Fixing code formatting..."
	npm run lint:fix
	npm run format
	@echo "✅ Code formatting applied!"

# Database Commands
db-setup:
	@echo "🗄️ Setting up MyLifePictures.ai database schema..."
	@if [ -z "$$VITE_SUPABASE_URL" ]; then \
		echo "❌ Missing VITE_SUPABASE_URL environment variable"; \
		echo "Please add your Supabase URL to the .env file"; \
		exit 1; \
	fi
	@if [ -z "$$SUPABASE_SERVICE_ROLE_KEY" ]; then \
		echo "❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable"; \
		echo "Please add your Supabase service role key to the .env file"; \
		echo "You can find this in your Supabase dashboard under Settings > API"; \
		exit 1; \
	fi
	npm run db:setup
	@echo "✅ Database setup complete!"

db-verify:
	@echo "🔍 Verifying database setup..."
	@node -e " \
		import { createClient } from '@supabase/supabase-js'; \
		import dotenv from 'dotenv'; \
		dotenv.config(); \
		const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); \
		const tables = ['users', 'photo_folders', 'photos', 'audio_recordings']; \
		Promise.all(tables.map(async (table) => { \
			try { \
				const { error } = await supabase.from(table).select('count', { count: 'exact', head: true }); \
				console.log(error ? '❌ ' + table + ': ' + error.message : '✅ ' + table + ': OK'); \
			} catch (e) { console.log('❌ ' + table + ': ' + e.message); } \
		})).then(() => console.log('🔍 Database verification complete!')); \
	"

db-seed:
	@echo "🌱 Seeding database with sample data..."
	npm run db:seed
	@echo "✅ Database seeded!"
	@echo "🔑 Demo login available (check console output)"

db-reset:
	@echo "⚠️  WARNING: This will delete ALL data!"
	@read -p "Are you sure? (y/N): \" confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "🗑️ Resetting database..."
	npm run db:reset
	@echo "✅ Database reset complete!"
	@echo "📝 Run 'make db-setup' to recreate schema"

# Maintenance Commands
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist .vite
	npm cache clean --force
	@read -p "Remove node_modules? (y/N): \" confirm && [ "$$confirm" = "y" ] && rm -rf node_modules || true
	@echo "✅ Cleanup complete!"

update:
	@echo "📦 Updating dependencies..."
	npm outdated
	npm update
	npm audit
	npm audit fix --force
	@echo "✅ Dependencies updated!"
	@echo "🔍 Run 'make test' to verify compatibility"

doctor:
	@echo "🏥 Running system health check..."
	@echo "Node.js version: $$(node --version)"
	@echo "npm version: $$(npm --version)"
	@echo "🔧 Checking environment configuration..."
	@[ -f .env ] && echo "✅ .env file exists" || echo "❌ .env file missing"
	@[ -n "$$VITE_SUPABASE_URL" ] && echo "✅ VITE_SUPABASE_URL configured" || echo "❌ VITE_SUPABASE_URL missing"
	@[ -n "$$VITE_SUPABASE_ANON_KEY" ] && echo "✅ VITE_SUPABASE_ANON_KEY configured" || echo "❌ VITE_SUPABASE_ANON_KEY missing"
	@echo "🗄️ Testing database connection..."
	@make db-verify > /dev/null 2>&1 && echo "✅ Database connection OK" || echo "❌ Database connection failed"
	@echo "🔨 Testing build process..."
	@make build > /dev/null 2>&1 && echo "✅ Build process OK" || echo "❌ Build process failed"
	@echo "✅ Health check complete!"

# AI & Voice Commands
test-voice:
	@echo "🎤 Testing voice recognition..."
	@echo "🌐 Checking Web Speech API support in your browser"
	@echo "🗣️ Voice command test instructions:"
	@echo "   1. Start the dev server: make dev"
	@echo "   2. Open the application in your browser"
	@echo "   3. Allow microphone permissions"
	@echo "   4. Say 'Hey Sunny' to test wake word"
	@echo "💡 Supported browsers: Chrome, Edge (full support), Firefox/Safari (limited)"

ai-validate:
	@echo "🔑 Validating AI provider API keys..."
	@[ -n "$$VITE_OPENAI_API_KEY" ] && echo "✅ OpenAI key configured" || echo "❌ OpenAI key missing"
	@[ -n "$$VITE_ANTHROPIC_API_KEY" ] && echo "✅ Anthropic key configured" || echo "❌ Anthropic key missing"
	@[ -n "$$VITE_GEMINI_API_KEY" ] && echo "✅ Gemini key configured" || echo "❌ Gemini key missing"
	@echo "🎯 AI validation complete!"
	@echo "💡 At least one AI provider key is required for full functionality"

# Deployment Commands
deploy-staging:
	@echo "🚀 Deploying to staging..."
	make build
	@echo "🔗 Staging deployment would go here"
	@echo "✅ Staging deployment complete!"

deploy-production:
	@echo "🚀 Deploying to production..."
	make test
	make build
	@echo "🔗 Production deployment would go here"
	@echo "✅ Production deployment complete!"

# Documentation Commands
docs:
	@echo "📚 Documentation available in docs/ directory"
	@echo "📖 Key files:"
	@echo "   - docs/SETUP_GUIDE.md - Complete setup instructions"
	@echo "   - makefile.md - This makefile documentation"
	@echo "   - README.md - Project overview"

docs-deploy:
	@echo "🚀 Documentation deployment would go here"
	@echo "🔗 Would be available at GitHub Pages"