# 360-Degree Feedback Review System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     360-DEGREE FEEDBACK REVIEW SYSTEM                       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND LAYER                               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      Next.js 14 Application                     │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │  │
│  │  │  │ Login Page   │  │ Register     │  │ Dashboard            │ │  │  │
│  │  │  │              │  │ Page         │  │                      │ │  │  │
│  │  │  │ - Email      │  │ - Form       │  │ - Stats              │ │  │  │
│  │  │  │ - Password   │  │ - Validation │  │ - Quick Actions      │ │  │  │
│  │  │  └──────────────┘  └──────────────┘  │ - Recent Activity    │ │  │  │
│  │  │                                       └──────────────────────┘ │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌────────────────────────────────────────────────────────┐   │  │  │
│  │  │  │           UI Components (shadcn/ui)                    │   │  │  │
│  │  │  │  • Button  • Input  • Label  • Card  • More...        │   │  │  │
│  │  │  └────────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌────────────────────────────────────────────────────────┐   │  │  │
│  │  │  │           State Management & Services                  │   │  │  │
│  │  │  │  • AuthContext (React Context)                         │   │  │  │
│  │  │  │  • API Client (Axios with interceptors)               │   │  │  │
│  │  │  │  • Token Management (LocalStorage)                    │   │  │  │
│  │  │  └────────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                                 │  │  │
│  │  │  Technology Stack:                                              │  │  │
│  │  │  • Next.js 14 (App Router)  • TypeScript  • Tailwind CSS       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      │ REST API                             │
│                                      │ (JSON)                               │
│                                      ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          BACKEND LAYER                               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Express.js Server                            │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │              Middleware Layer                            │ │  │  │
│  │  │  │  • CORS  • Helmet  • Rate Limiter  • Morgan            │ │  │  │
│  │  │  │  • Authenticate  • Authorize  • Validate  • Error      │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │              API Routes (RESTful)                        │ │  │  │
│  │  │  │                                                          │ │  │  │
│  │  │  │  /api/v1/auth           /api/v1/users                   │ │  │  │
│  │  │  │  • POST /register       • GET /                         │ │  │  │
│  │  │  │  • POST /login          • GET /:id                      │ │  │  │
│  │  │  │  • POST /refresh        • POST /                        │ │  │  │
│  │  │  │  • GET /profile         • PUT /:id                      │ │  │  │
│  │  │  │  • PUT /profile         • DELETE /:id                   │ │  │  │
│  │  │  │                                                          │ │  │  │
│  │  │  │  /api/v1/review-cycles  /api/v1/feedback               │ │  │  │
│  │  │  │  • GET /                • GET /requests/my              │ │  │  │
│  │  │  │  • GET /:id             • GET /requests/:id             │ │  │  │
│  │  │  │  • POST /               • POST /requests/:id/submit     │ │  │  │
│  │  │  │  • PUT /:id             • GET /my                       │ │  │  │
│  │  │  │  • DELETE /:id                                          │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │              Controllers (Business Logic)                │ │  │  │
│  │  │  │  • authController      • userController                 │ │  │  │
│  │  │  │  • reviewCycleController • feedbackController           │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │              Models (Sequelize ORM)                      │ │  │  │
│  │  │  │  • User          • ReviewCycle                           │ │  │  │
│  │  │  │  • FeedbackRequest  • Feedback                           │ │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                                 │  │  │
│  │  │  Technology Stack:                                              │  │  │
│  │  │  • Node.js 18+  • Express  • Sequelize  • JWT  • bcryptjs      │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      │ SQL                                  │
│                                      │ (Sequelize ORM)                      │
│                                      ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         DATABASE LAYER                               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    PostgreSQL Database                          │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐  │  │  │
│  │  │  │  users   │  │ review_cycles │  │ feedback_requests       │  │  │  │
│  │  │  │          │  │              │  │                         │  │  │  │
│  │  │  │ • id     │  │ • id         │  │ • id                    │  │  │  │
│  │  │  │ • email  │  │ • name       │  │ • reviewCycleId (FK)   │  │  │  │
│  │  │  │ • pass   │  │ • startDate  │  │ • revieweeId (FK)      │  │  │  │
│  │  │  │ • role   │  │ • endDate    │  │ • reviewerId (FK)      │  │  │  │
│  │  │  │ • ...    │  │ • status     │  │ • relationshipType      │  │  │  │
│  │  │  └──────────┘  └──────────────┘  │ • status                │  │  │  │
│  │  │                                   └─────────────────────────┘  │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌──────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │  feedbacks                                               │  │  │  │
│  │  │  │                                                          │  │  │  │
│  │  │  │  • id                    • problemSolving (1-5)         │  │  │  │
│  │  │  │  • feedbackRequestId(FK) • strengths (TEXT)             │  │  │  │
│  │  │  │  • technicalSkills(1-5)  • areasForImprovement (TEXT)  │  │  │  │
│  │  │  │  • communication (1-5)    • additionalComments (TEXT)   │  │  │  │
│  │  │  │  • leadership (1-5)       • isAnonymous (BOOLEAN)       │  │  │  │
│  │  │  │  • teamwork (1-5)                                        │  │  │  │
│  │  │  └──────────────────────────────────────────────────────────┘  │  │  │
│  │  │                                                                 │  │  │
│  │  │  Relationships:                                                 │  │  │
│  │  │  • User → ReviewCycle (1:Many) - Creator                       │  │  │
│  │  │  • User → User (1:Many) - Manager/Subordinates                │  │  │
│  │  │  • ReviewCycle → FeedbackRequest (1:Many)                      │  │  │
│  │  │  • User → FeedbackRequest (1:Many) - Reviewee                 │  │  │
│  │  │  • User → FeedbackRequest (1:Many) - Reviewer                 │  │  │
│  │  │  • FeedbackRequest → Feedback (1:1)                            │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

## Security Features

┌────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Network Layer                                              │
│     • CORS Protection                                          │
│     • Rate Limiting (100 req/15min)                           │
│     • Helmet Security Headers                                  │
│                                                                │
│  2. Authentication Layer                                       │
│     • JWT Tokens (Access + Refresh)                           │
│     • Password Hashing (bcryptjs, 10 rounds)                  │
│     • Token Expiration (7d access, 30d refresh)               │
│                                                                │
│  3. Authorization Layer                                        │
│     • Role-Based Access Control (RBAC)                        │
│     • Resource-Level Permissions                              │
│     • Owner Verification                                       │
│                                                                │
│  4. Data Layer                                                 │
│     • SQL Injection Protection (Sequelize ORM)                │
│     • Input Validation (express-validator)                    │
│     • XSS Protection                                           │
│                                                                │
│  5. Application Layer                                          │
│     • Centralized Error Handling                              │
│     • Secure Session Management                               │
│     • Environment Variables (.env)                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘

## Data Flow - Authentication Example

┌─────────┐                                                  ┌──────────┐
│         │  1. POST /auth/login                            │          │
│         │  { email, password }                            │          │
│  User   │ ──────────────────────────────────────────────> │ Frontend │
│ Browser │                                                  │ (Next.js)│
│         │                                                  │          │
└─────────┘                                                  └────┬─────┘
    ▲                                                             │
    │                                                             │
    │                                                             │ 2. Axios
    │                                                             │    Request
    │                                                             ▼
    │                                                        ┌──────────┐
    │                                                        │          │
    │                                                        │ Backend  │
    │                                                        │ (Express)│
    │                                                        │          │
    │                                                        └────┬─────┘
    │                                                             │
    │                                                             │ 3. Validate
    │                                                             │    Input
    │                                                             ▼
    │                                                        ┌──────────┐
    │                                                        │   Auth   │
    │                                                        │Controller│
    │                                                        └────┬─────┘
    │                                                             │
    │                                                             │ 4. Query
    │                                                             ▼
    │                                                        ┌──────────┐
    │                                                        │   User   │
    │                                                        │  Model   │
    │                                                        └────┬─────┘
    │                                                             │
    │                                                             │ 5. SQL
    │                                                             ▼
    │                                                        ┌──────────┐
    │                                                        │PostgreSQL│
    │                                                        │ Database │
    │                                                        └────┬─────┘
    │                                                             │
    │  8. Display                                                 │ 6. Return
    │     Dashboard                                               │    User Data
    │     & Store                                                 ▼
    │     Token                                              ┌──────────┐
    │                                                        │ Generate │
    │                                                        │   JWT    │
    │                    7. Response                         │  Tokens  │
    │  { user, token, refreshToken }                        └────┬─────┘
    └────────────────────────────────────────────────────────────┘

## Deployment Architecture (Recommended)

┌──────────────────────────────────────────────────────────────┐
│                      PRODUCTION SETUP                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend:                                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Vercel / Netlify / AWS Amplify                        │ │
│  │  • Static hosting                                      │ │
│  │  • CDN distribution                                    │ │
│  │  • Automatic SSL                                       │ │
│  │  • Environment variables                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Backend:                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AWS EC2 / DigitalOcean / Heroku                       │ │
│  │  • Node.js runtime                                     │ │
│  │  • PM2 process manager                                 │ │
│  │  • Nginx reverse proxy                                 │ │
│  │  • SSL certificate (Let's Encrypt)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Database:                                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AWS RDS / DigitalOcean Managed Database               │ │
│  │  • PostgreSQL 14+                                      │ │
│  │  • Automated backups                                   │ │
│  │  • Encryption at rest                                  │ │
│  │  • Read replicas (optional)                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Technology Choices Rationale

### Frontend: Next.js 14.2.35 (Security Patched)
- ✅ Server-side rendering for better SEO and performance
- ✅ App Router for modern React patterns
- ✅ Built-in optimization (images, fonts, etc.)
- ✅ TypeScript support out of the box
- ✅ Easy deployment to Vercel
- ⚠️ **Security Update**: Version 14.2.35 includes patches for:
  - DoS vulnerabilities with Server Components
  - Authorization bypass vulnerabilities
  - Cache poisoning vulnerabilities
  - SSRF in Server Actions
  - Middleware authorization bypass

### UI: shadcn/ui + Tailwind CSS
- ✅ Modern, accessible components
- ✅ Highly customizable
- ✅ Utility-first CSS for rapid development
- ✅ Microsoft blue theme implementation
- ✅ Responsive design made easy

### Backend: Node.js + Express
- ✅ JavaScript full-stack (same language)
- ✅ Large ecosystem and community
- ✅ High performance for I/O operations
- ✅ Easy to scale horizontally
- ✅ Mature and battle-tested

### Database: PostgreSQL + Sequelize
- ✅ ACID compliance for data integrity
- ✅ Complex queries support
- ✅ JSON data type support
- ✅ Excellent performance
- ✅ ORM abstraction with Sequelize

### Authentication: JWT
- ✅ Stateless authentication
- ✅ Easy to scale
- ✅ Mobile-friendly
- ✅ Refresh token support
- ✅ Industry standard
