# Setup Commands for MyLifePictures.ai

Since the `make` command is not available in your environment, use these npm commands instead:

## Initial Setup
```bash
# Install dependencies (this will happen automatically after package.json update)
npm install

# Setup database
npm run db:setup

# Start development server
npm run dev
```

## Database Commands
```bash
# Setup database schema
npm run db:setup

# Verify database setup
npm run test

# Seed with sample data
npm run db:seed

# Reset database (DESTRUCTIVE)
npm run db:reset
```

## Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

## Next Steps After Dependencies Install
1. Configure your `.env` file with:
   - VITE_SUPABASE_URL (from Supabase dashboard)
   - VITE_SUPABASE_ANON_KEY (from Supabase dashboard)
   - SUPABASE_SERVICE_ROLE_KEY (for database setup)
   - At least one AI provider API key

2. Run `npm run db:setup` to setup the database

3. Run `npm run dev` to start development

## Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_OPENAI_API_KEY=your_openai_key (optional)
VITE_ANTHROPIC_API_KEY=your_anthropic_key (optional)
VITE_GEMINI_API_KEY=your_gemini_key (optional)
```