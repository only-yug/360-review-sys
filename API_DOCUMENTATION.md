# API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Health Check

### Check API Status
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication Endpoints

### Register New User
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "department": "Engineering",
  "position": "Software Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "department": "Engineering",
      "position": "Software Engineer"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

### Get Current User Profile
```http
GET /auth/profile
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ }
  }
}
```

### Update Profile
```http
PUT /auth/profile
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "department": "Engineering",
  "position": "Senior Software Engineer"
}
```

### Change Password
```http
POST /auth/change-password
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

## User Management Endpoints

### List All Users
```http
GET /users?page=1&limit=10&search=&role=&department=
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (admin, manager, employee)
- `department` (optional): Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [/* array of users */],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

### Get User by ID
```http
GET /users/:id
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "Manager": { /* manager details */ },
      "Subordinates": [/* array of subordinates */]
    }
  }
}
```

### Create User (Admin Only)
```http
POST /users
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "new.user@company.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "employee",
  "department": "Marketing",
  "position": "Marketing Manager",
  "managerId": "manager_uuid"
}
```

### Update User (Admin/Manager Only)
```http
PUT /users/:id
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "manager",
  "department": "Marketing",
  "position": "Senior Marketing Manager",
  "managerId": "manager_uuid",
  "isActive": true
}
```

### Deactivate User (Admin Only)
```http
DELETE /users/:id
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## Review Cycle Endpoints

### List All Review Cycles
```http
GET /review-cycles?page=1&limit=10&status=
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (draft, active, completed, archived)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviewCycles": [
      {
        "id": "uuid",
        "name": "Q1 2024 Performance Review",
        "description": "First quarter performance review",
        "startDate": "2024-01-01",
        "endDate": "2024-03-31",
        "status": "active",
        "Creator": { /* creator details */ }
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### Get Review Cycle by ID
```http
GET /review-cycles/:id
```
**Headers:** `Authorization: Bearer <token>`

### Create Review Cycle (Admin/Manager Only)
```http
POST /review-cycles
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Q1 2024 Performance Review",
  "description": "First quarter performance review",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "status": "draft"
}
```

### Update Review Cycle (Admin/Manager Only)
```http
PUT /review-cycles/:id
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Q1 2024 Performance Review - Updated",
  "description": "Updated description",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "status": "active"
}
```

### Archive Review Cycle (Admin Only)
```http
DELETE /review-cycles/:id
```
**Headers:** `Authorization: Bearer <token>`

---

## Feedback Endpoints

### Get My Feedback Requests
```http
GET /feedback/requests/my?status=
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (pending, in_progress, completed, skipped)

**Response:**
```json
{
  "success": true,
  "data": {
    "feedbackRequests": [
      {
        "id": "uuid",
        "relationshipType": "peer",
        "status": "pending",
        "dueDate": "2024-03-31",
        "Reviewee": { /* reviewee details */ },
        "ReviewCycle": { /* review cycle details */ },
        "Feedback": null
      }
    ]
  }
}
```

### Get Feedback Request by ID
```http
GET /feedback/requests/:id
```
**Headers:** `Authorization: Bearer <token>`

### Submit Feedback
```http
POST /feedback/requests/:feedbackRequestId/submit
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "technicalSkills": 4,
  "communication": 5,
  "leadership": 4,
  "teamwork": 5,
  "problemSolving": 4,
  "strengths": "Excellent communication and leadership skills.",
  "areasForImprovement": "Could improve technical documentation.",
  "additionalComments": "Great team player and always willing to help.",
  "isAnonymous": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "feedback": { /* feedback object */ }
  }
}
```

### Get My Received Feedback
```http
GET /feedback/my
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "feedbackRequests": [
      {
        "id": "uuid",
        "relationshipType": "peer",
        "status": "completed",
        "completedAt": "2024-03-15",
        "Reviewer": { /* reviewer details or "Anonymous" */ },
        "ReviewCycle": { /* review cycle details */ },
        "Feedback": {
          "technicalSkills": 4,
          "communication": 5,
          "strengths": "...",
          "areasForImprovement": "..."
        }
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Response when exceeded**:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Notes

1. All dates should be in ISO 8601 format
2. UUIDs are used for all resource IDs
3. Pagination defaults: page=1, limit=10
4. Rating scales are 1-5 (1=Poor, 5=Excellent)
5. Anonymous feedback hides reviewer information
6. Soft delete is used for users (isActive flag)
7. Archive is used for review cycles instead of delete
