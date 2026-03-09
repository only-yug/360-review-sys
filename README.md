# 360-Degree Feedback Review System

A comprehensive employee feedback and review management system designed for internal company use. This system enables organizations to conduct 360-degree performance reviews, collecting feedback from peers, managers, and subordinates.

## 🏗️ Architecture

This project follows a modern, scalable architecture with separated concerns:

- **Backend**: Node.js + Express + Sequelize + PostgreSQL
- **Frontend**: Next.js 14+ + shadcn/ui + Tailwind CSS

## 📁 Project Structure

```
.
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   ├── config/   # Database and app configuration
│   │   ├── models/   # Sequelize database models
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/   # API route definitions
│   │   ├── middleware/ # Authentication, authorization, etc.
│   │   └── utils/    # Helper functions
│   └── package.json
│
└── frontend/         # Next.js application
    ├── src/
    │   ├── app/      # Next.js App Router pages
    │   ├── components/ # React components
    │   ├── lib/      # Utilities and configurations
    │   └── styles/   # Global styles
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your database credentials in .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your API URL in .env.local
npm run dev
```


### Docker Setup

You can also run the project using Docker.

1.  **Configure Environment**: Ensure `backend/.env` exists and has valid values.
2.  **Run Migrations** (First time only):
    ```bash
    docker-compose run --rm backend npm run db:migrate
    ```
3.  **Start Services**:
    ```bash
    docker-compose up --build
    ```
    The backend will be available at `http://localhost:5000`.

## 🎨 Design System

The UI follows a clean, flat design philosophy with:
- **Primary Color**: Microsoft Blue (#0078D4)
- **Design Principles**: Minimal gradients, clear hierarchy, modern flat UI
- **Component Library**: shadcn/ui with Tailwind CSS

## 🔐 Features

- **Authentication & Authorization**: JWT-based secure authentication with role-based access control
- **User Management**: Admin interface for managing employees
- **360-Degree Reviews**: Multi-source feedback collection
- **Review Cycles**: Scheduled performance review periods
- **Feedback Requests**: Automated feedback request system
- **Analytics Dashboard**: Insights and performance metrics
- **Responsive Design**: Mobile-friendly interface

## 📚 API Documentation

API documentation is available at `/api/docs` when running the backend server.

## 🤝 Contributing

Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License.