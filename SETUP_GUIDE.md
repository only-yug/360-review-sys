# 360 Feedback Review System - Setup & Deployment Guide

This guide covers everything you need to set up the project on another computer, either for local development or preparing for a production deployment.

## 📋 Prerequisites
Before starting, ensure the target machine has the following installed:
1. **Node.js** (v18.0.0 or higher)
2. **npm** (v9.0.0 or higher)
3. **PostgreSQL** (Installed locally, or a remote DB like Supabase)
4. **Git** (to clone the repository, if applicable)

---

## 🗄️ Step 1: Database Initialization
Because of how Sequelize works, you don't even need to create the database manually! Ensure PostgreSQL is running on your machine, then wait until Step 2 to create the database automatically with a simple command.

*(If you are using Supabase or a remote database, it is usually already created and you just need the connection URL).*

---

## ⚙️ Step 2: Backend Setup

Open a terminal and navigate to the backend folder:
```bash
cd backend
```

**1. Install Dependencies**
```bash
npm install
```

**2. Configure Environment Variables**
Create a new file named `.env` in the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```
Open `.env` and fill in your database details:
```env
DB_HOST=localhost       # Or your remote DB URL
DB_PORT=5432            # Default PostgreSQL port
DB_NAME=feedback_system # Name of the DB you created
DB_USERNAME=postgres    # Your PG username
DB_PASSWORD=your_password_here # Your PG password
```

**3. Create the Database**
If the database (as named in your `.env`) does not exist yet, Sequelize can create it for you automatically:
```bash
npm run db:create
```

**4. Run Database Migrations & Initial Setup**
This will automatically build all your tables and insert your default admin user (using the `.env` credentials):
```bash
npm run db:migrate
```
*(Optional) You can also run `npm run create-admin` to manually trigger the admin creation script instead, but `db:migrate` does it automatically now.*

**5. Start the Backend Server**
- For **Local Development**: `npm run dev`
- For **Production**: `npm run start`

---

## 🎨 Step 3: Frontend Setup

Open a **new** terminal window and navigate to the frontend folder:
```bash
cd frontend
```

**1. Install Dependencies**
```bash
npm install
```

**2. Configure Environment Variables**
Create a `.env` file in the `frontend/` directory (you can copy `.env.example`):
```bash
cp .env.example .env
```
Ensure it points to your backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```
*(If you are deploying to production, replace `localhost:5000` with your actual backend deployed URL).*

**3. Start the Frontend Server**
- For **Local Development**:
  ```bash
  npm run dev
  ```
- For **Production** (You must build it first):
  ```bash
  npm run build
  npm start
  ```

---

## 🚀 Moving to Production Reminders
1. **Change JWT Secrets**: Generate a strong string for `JWT_SECRET` and `JWT_REFRESH_SECRET` in the backend `.env`.
2. **Update CORS Address**: Set `CORS_ORIGIN` in the backend to exactly match your live frontend domain (e.g., `https://my-feedback-app.vercel.app`).
3. **Run Migrations on Server**: Most hosting platforms require you to specify a "Build Command". Your backend build command should usually be `npm install && npm run db:migrate` so the live DB gets updated.
