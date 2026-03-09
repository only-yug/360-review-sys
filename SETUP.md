# 360-Degree Feedback Review System - Setup Guide

This guide will help you set up and run the complete 360-degree feedback review system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    360 Feedback System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │     Frontend     │              │     Backend      │    │
│  │                  │              │                  │    │
│  │  Next.js 14+     │◄────────────►│  Node.js         │    │
│  │  TypeScript      │   REST API   │  Express         │    │
│  │  Tailwind CSS    │              │  Sequelize       │    │
│  │  shadcn/ui       │              │  JWT Auth        │    │
│  │                  │              │                  │    │
│  │  Port: 3000      │              │  Port: 5000      │    │
│  └──────────────────┘              └─────────┬────────┘    │
│                                               │              │
│                                               │              │
│                                    ┌──────────▼────────┐    │
│                                    │   PostgreSQL       │    │
│                                    │   Database         │    │
│                                    │   Port: 5432       │    │
│                                    └────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ghanshyam-digital/360-feedback-review-system.git
cd 360-feedback-review-system
```

### 2. Set Up PostgreSQL Database

Open PostgreSQL and create a new database:

```sql
CREATE DATABASE feedback_system;
```

Or using command line:

```bash
createdb feedback_system
```

### 3. Configure Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_secure_secret_key_here
```

### 4. Configure Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

The default API URL should work if backend runs on port 5000:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 5. Start the Application

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

You should see:
```
✓ Database connection established successfully.
✓ Database models synchronized
✓ Server running on port 5000
✓ Environment: development
✓ API available at: http://localhost:5000/api/v1
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
```

### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1/health

## Default User Accounts

After first run, you can register new users through the UI. The first user will have the role of "employee" by default. To create an admin user, you'll need to:

1. Register a user through the UI
2. Manually update the user's role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Features Implemented

### Authentication & Authorization
- ✅ User registration
- ✅ User login
- ✅ JWT token-based authentication
- ✅ Token refresh mechanism
- ✅ Role-based access control (Admin, Manager, Employee)
- ✅ Protected routes

### User Management
- ✅ List all users (with pagination and filters)
- ✅ View user details
- ✅ Create new users (Admin only)
- ✅ Update user information (Admin/Manager)
- ✅ Deactivate users (Admin only)

### Database Models
- ✅ User model with roles and hierarchy
- ✅ ReviewCycle model for review periods
- ✅ FeedbackRequest model for requesting feedback
- ✅ Feedback model for storing reviews

### UI/UX
- ✅ Clean, flat design with Microsoft blue theme
- ✅ Responsive layout for all devices
- ✅ Modern component library (shadcn/ui)
- ✅ Intuitive navigation
- ✅ Dashboard with quick stats

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Users (Protected)
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user (Admin)
- `PUT /api/v1/users/:id` - Update user (Admin/Manager)
- `DELETE /api/v1/users/:id` - Deactivate user (Admin)

### Health Check
- `GET /api/v1/health` - API health check

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, bcryptjs
- **Validation**: express-validator
- **Logging**: Morgan

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Context API

## Database Schema

### Users Table
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- firstName (String)
- lastName (String)
- role (Enum: admin, manager, employee)
- department (String)
- position (String)
- managerId (UUID, Foreign Key)
- isActive (Boolean)
- lastLogin (Date)
- timestamps (createdAt, updatedAt)

### ReviewCycles Table
- id (UUID, Primary Key)
- name (String)
- description (Text)
- startDate (Date)
- endDate (Date)
- status (Enum: draft, active, completed, archived)
- createdBy (UUID, Foreign Key)
- timestamps (createdAt, updatedAt)

### FeedbackRequests Table
- id (UUID, Primary Key)
- reviewCycleId (UUID, Foreign Key)
- revieweeId (UUID, Foreign Key)
- reviewerId (UUID, Foreign Key)
- relationshipType (Enum: self, peer, manager, subordinate, other)
- status (Enum: pending, in_progress, completed, skipped)
- dueDate (Date)
- completedAt (Date)
- timestamps (createdAt, updatedAt)

### Feedbacks Table
- id (UUID, Primary Key)
- feedbackRequestId (UUID, Foreign Key)
- technicalSkills (Integer, 1-5)
- communication (Integer, 1-5)
- leadership (Integer, 1-5)
- teamwork (Integer, 1-5)
- problemSolving (Integer, 1-5)
- strengths (Text)
- areasForImprovement (Text)
- additionalComments (Text)
- isAnonymous (Boolean)
- timestamps (createdAt, updatedAt)

## Development Tips

### Backend Development
```bash
cd backend
npm run dev    # Start with nodemon (auto-reload)
```

### Frontend Development
```bash
cd frontend
npm run dev    # Start Next.js dev server
npm run lint   # Run ESLint
npm run build  # Create production build
```

### Database Management
```bash
cd backend
npm run db:migrate    # Run migrations
npm run db:seed       # Run seeders
```

## Security Features

- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT-based authentication with refresh tokens
- ✅ HTTP security headers (Helmet)
- ✅ CORS protection
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation and sanitization
- ✅ SQL injection protection (Sequelize ORM)
- ✅ XSS protection

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Port Already in Use
- Backend (5000): Change `PORT` in `backend/.env`
- Frontend (3000): Run with `npm run dev -- -p 3001`

### Module Not Found
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in environment
2. Update database credentials for production
3. Set strong JWT secrets
4. Enable SSL for database connection
5. Run: `npm start`

### Frontend
1. Update `NEXT_PUBLIC_API_URL` to production API
2. Build: `npm run build`
3. Start: `npm start`
4. Or deploy to Vercel/Netlify

## Support

For issues or questions:
1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

## License

MIT License - See LICENSE file for details
