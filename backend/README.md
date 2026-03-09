# Backend - 360-Degree Feedback Review System

Node.js + Express + Sequelize + PostgreSQL backend for the 360-degree feedback review system.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials and other settings.

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE feedback_system;
```

2. The application will automatically sync database models in development mode.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get current user profile
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Users (Protected Routes)
- `GET /api/v1/users` - Get all users (with pagination and filters)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user (Admin only)
- `PUT /api/v1/users/:id` - Update user (Admin/Manager only)
- `DELETE /api/v1/users/:id` - Deactivate user (Admin only)

### Health Check
- `GET /api/v1/health` - API health check

## Database Models

### User
- Authentication and user profile information
- Roles: admin, manager, employee
- Hierarchical structure with manager-subordinate relationships

### ReviewCycle
- Performance review periods
- Status tracking (draft, active, completed, archived)

### FeedbackRequest
- Requests for feedback from specific reviewers
- Relationship types: self, peer, manager, subordinate, other
- Status tracking

### Feedback
- Actual feedback submissions
- Competency ratings (1-5 scale)
- Qualitative feedback (strengths, areas for improvement, comments)
- Anonymous feedback support

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Custom middleware
├── models/         # Sequelize models
├── routes/         # API routes
├── utils/          # Utility functions
└── server.js       # Main application file
```
