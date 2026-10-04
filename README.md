# TNPSC + UGC NET + SET Study Portal

A bilingual video-based competitive exam learning web application supporting **English** and **Tamil (தமிழ்)**.

## Project Structure

```
tnpsc-study-portal/
│
├── frontend/             # React + Vite Frontend
│   ├── src/              # React UI source code
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   └── vite.config.js    # Vite configuration
│
├── backend/              # Node.js + Express Backend API
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models
│   ├── routes/           # Express API routes
│   ├── middleware/       # JWT & Auth middleware
│   ├── utils/            # Helper utilities
│   ├── server.js         # Entry point
│   ├── .env              # Environment variables (local)
│   └── package.json      # Backend dependencies
│
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Local MongoDB Community Server running on `mongodb://localhost:27017`

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`.

## Environment Variables (.env)
- `PORT`: Backend server port (default: 5000)
- `MONGODB_URI`: Local MongoDB connection string (`mongodb://localhost:27017/tnpsc_study_portal`)
- `JWT_SECRET`: Secret key for token generation
- `CLOUDINARY_*`: Credentials for video asset management (Cloudinary)
