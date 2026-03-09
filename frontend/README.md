# Frontend - 360-Degree Feedback Review System

Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui frontend for the 360-degree feedback review system.

## Features

- Modern, clean UI with Microsoft blue theme
- Flat design with minimal gradients
- Responsive design for all devices
- Built with Next.js 14 App Router
- shadcn/ui component library
- Type-safe with TypeScript
- JWT-based authentication

## Prerequisites

- Node.js 18+ and npm

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Update the `.env.local` file with your backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## Running the Application

### Development Mode
```bash
npm run dev
```

Visit http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── login/        # Login page
│   ├── register/     # Registration page
│   ├── dashboard/    # Dashboard page
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page (redirects)
│   └── globals.css   # Global styles
├── components/       # React components
│   └── ui/           # shadcn/ui components
├── lib/              # Utilities and configurations
│   ├── api.ts        # API client
│   ├── auth-context.tsx  # Authentication context
│   └── utils.ts      # Utility functions
└── styles/           # Additional styles
```

## Design System

### Colors
- **Primary**: Microsoft Blue (#0078D4)
- **Clean, flat design** with minimal gradients
- Modern typography using Inter font

### Components
The UI uses shadcn/ui components:
- Button
- Input
- Label
- Card
- And more...

All components are customizable and follow the design system.

## Pages

### Authentication
- `/login` - User login
- `/register` - New user registration

### Dashboard
- `/dashboard` - Main dashboard with:
  - Welcome message
  - Quick stats (pending reviews, completed reviews, team members)
  - Quick action buttons
  - Recent activity feed

## API Integration

The frontend communicates with the backend API using axios. The API client includes:
- Automatic token injection
- Token refresh on expiry
- Error handling
- Request/response interceptors

## Authentication

Uses JWT-based authentication with:
- Login/Register functionality
- Token storage in localStorage
- Automatic token refresh
- Protected routes
- Auth context for global state

## Development

### Adding New Pages
1. Create a new folder in `src/app/`
2. Add a `page.tsx` file
3. Use the auth context for protected routes

### Adding New Components
1. Create component in `src/components/`
2. Use shadcn/ui components from `src/components/ui/`
3. Follow the existing patterns

### Styling
- Use Tailwind CSS utility classes
- Follow the design system colors
- Keep the flat, clean aesthetic
- Avoid heavy gradients

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `.next` folder.
