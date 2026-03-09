# Quick Start Guide - 360-Degree Feedback Review System

## 🚀 Get Started in 5 Minutes

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Git installed

### Step 1: Clone & Setup (2 minutes)

```bash
# Clone the repository
git clone https://github.com/ghanshyam-digital/360-feedback-review-system.git
cd 360-feedback-review-system

# Create PostgreSQL database
createdb feedback_system
```

### Step 2: Backend Setup (1 minute)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and update these values:
```env
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
```

### Frontend Setup (1 minute)

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

The default settings should work if your backend is on port 5000.

**🔒 Security Note:** This project uses Next.js 14.2.35 which includes critical security patches for:
- DoS vulnerabilities
- Authorization bypass
- Cache poisoning
- SSRF in Server Actions

### Step 4: Run the Application (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Access & Test

1. Open http://localhost:3000
2. Click "Sign up" to create an account
3. Fill in the registration form
4. Login and explore the dashboard

## 🎯 What You Get

### Pages
- ✅ Login page
- ✅ Register page  
- ✅ Dashboard with stats

### Backend API (20+ endpoints)
- ✅ Authentication (register, login, refresh token)
- ✅ User management (CRUD operations)
- ✅ Review cycles management
- ✅ Feedback submission and viewing

### Security
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Role-based access (Admin/Manager/Employee)
- ✅ Rate limiting
- ✅ CORS protection

## 📚 Need More Info?

- **Full Setup Guide:** See [SETUP.md](./SETUP.md)
- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Architecture Details:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Project Summary:** See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## 🎨 Design Features

- **Color Scheme:** Microsoft Blue (#0078D4)
- **Design Style:** Clean, flat design with minimal gradients
- **Responsive:** Works on desktop, tablet, and mobile
- **Components:** Modern UI with shadcn/ui

## 🔑 First Steps After Setup

1. **Create Admin User**
   - Register through the UI
   - Connect to PostgreSQL:
     ```sql
     UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
     ```

2. **Test the API**
   - Visit http://localhost:5000/api/v1/health
   - Should return: `{"success": true, "message": "API is running"}`

3. **Explore the Dashboard**
   - View your profile
   - Check the quick stats
   - Try the quick action buttons

## ⚡ Quick Commands Reference

### Backend
```bash
npm run dev      # Start development server
npm start        # Start production server
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed database
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run linter
```

## 🐛 Troubleshooting

**Database Connection Error:**
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `backend/.env`

**Port Already in Use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Run `npm run dev -- -p 3001`

**Module Not Found:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feedback_system
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## 🎓 Learning Path

### Beginner
1. Explore the login/register flow
2. Check the dashboard interface
3. Review the API documentation
4. Test API endpoints with Postman/Thunder Client

### Intermediate
1. Understand the database models
2. Review the authentication flow
3. Study the controller logic
4. Explore the React components

### Advanced
1. Extend with new features
2. Add email notifications
3. Implement analytics dashboard
4. Deploy to production

## 🌟 Key Features

| Feature | Status |
|---------|--------|
| User Authentication | ✅ Complete |
| JWT Tokens | ✅ Complete |
| Role-Based Access | ✅ Complete |
| User Management | ✅ Complete |
| Review Cycles | ✅ Complete |
| Feedback System | ✅ Complete |
| Responsive UI | ✅ Complete |
| API Documentation | ✅ Complete |
| Security Features | ✅ Complete |

## 💡 Tips

1. **Use the .example files**: Always copy `.env.example` to create your `.env`
2. **Check logs**: Look at terminal output for errors
3. **Database migrations**: Run migrations when models change
4. **API testing**: Use tools like Postman to test endpoints
5. **Documentation**: Refer to the detailed docs for advanced features

## 🤝 Next Steps

1. ✅ Complete initial setup
2. ✅ Test login/register flow
3. ✅ Explore the dashboard
4. ⏳ Create additional user accounts
5. ⏳ Set up review cycles
6. ⏳ Submit feedback
7. ⏳ View analytics

## 📞 Support

- Check documentation files
- Review code comments
- Test API with provided examples
- Follow the architecture diagrams

---

**Ready to build something amazing! 🚀**

Start developing by exploring the codebase and documentation.
