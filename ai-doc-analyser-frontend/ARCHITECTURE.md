# Frontend Architecture

This document describes the architecture of the React frontend for AI Document Analyser.

Important recent changes:

- **Auto-login removed**: The frontend no longer performs an automatic admin login on startup. Tests and developer scripts should perform explicit authentication or mock auth tokens. This avoids embedding credentials in source and improves security.
- **Development-only logging**: Verbose logging inside `src/services` (notably `apiService.js`) has been gated behind `process.env.NODE_ENV === 'development'` to prevent sensitive information from appearing in production logs.

Core concepts:

- React 19 with functional components and hooks
- Redux Toolkit for global state and feature slices (`chat`, `pdf`, `ui`)
- `src/services/apiService.js` provides a centralized axios instance with interceptors and standardized error handling
- Tests use Vitest + React Testing Library; update test setup to perform explicit auth flows where needed

Test run notes:

- After the recent cleanup, run `npm test` and update tests that assumed auto-login to perform explicit login or mock authentication tokens.

