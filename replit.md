# Grubby - Restaurant Discovery & Review Platform

## Overview
This is a premium restaurant discovery and review platform built with React, TypeScript, Vite, and Supabase. The application allows users to discover restaurants, write reviews, plan trips, and connect with friends around dining experiences.

## Recent Changes
- **2024-09-23**: Successfully imported and configured project for Replit environment
  - Updated Vite configuration to use port 5000 with host 0.0.0.0
  - Configured workflow for development server
  - Added production build configuration with http-server
  - Set up deployment configuration for autoscale

## Project Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4.10
- **UI Components**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with custom theming
- **Routing**: React Router DOM 6
- **State Management**: React Query (TanStack Query) + Context API
- **Mobile Support**: Capacitor for mobile app deployment

### Backend Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Edge Functions**: Multiple Supabase Edge Functions for various APIs
- **Storage**: Supabase Storage for image handling

### Key Features
- Restaurant discovery and reviews
- Trip planning with itinerary management
- Social features (friends, activity feeds)
- Expert ratings and recommendations
- Photo galleries and community features
- Map integration with location services
- Flight and hotel booking integration
- Mobile responsive design

### Environment Configuration
- Development server runs on port 5000
- Supabase project ID: `ocpmhsquwsdaauflbygf`
- Environment variables configured in `.env` for Supabase connection

### Development Workflow
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Serve production build
- `npm run lint` - Run ESLint

### Deployment
- Configured for Replit autoscale deployment
- Build command: `npm run build`
- Start command: `npm start`
- Uses http-server to serve static files in production

## Project Structure
- `/src` - Main application source code
- `/src/components` - Reusable UI components
- `/src/pages` - Page components for routing
- `/src/contexts` - React context providers
- `/src/hooks` - Custom React hooks
- `/src/integrations/supabase` - Supabase client and types
- `/supabase` - Supabase configuration and migrations
- `/public` - Static assets

## User Preferences
- Project uses modern React patterns with TypeScript
- Follows shadcn/ui component architecture
- Mobile-first responsive design approach