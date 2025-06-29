import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize app with better error handling
try {
  const root = createRoot(document.getElementById('root')!);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('💥 Failed to initialize React app:', error);
  
  // Fallback error display
  document.getElementById('root')!.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem; max-width: 500px;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Failed to Load Application</h1>
        <p style="color: #6b7280; margin-bottom: 2rem;">
          The application failed to initialize. This is likely a configuration issue.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;"
        >
          Reload Page
        </button>
        <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.375rem; text-align: left;">
          <strong>Error:</strong>
          <pre style="margin-top: 0.5rem; font-size: 0.75rem; overflow: auto;">${error}</pre>
        </div>
      </div>
    </div>
  `;
}