# MedManage

MedManage is a hospital management web application built with the MERN stack. It supports patient onboarding, doctor discovery, appointment booking, queue management, profile management, and live queue updates for doctors and reception staff.

## Project overview

The application currently includes these core flows:

- User registration and login, including OTP-based registration and Google sign-in flows
- Role-based access for patients, doctors, and receptionists
- Patient search and doctor profile browsing
- Physical consultation booking and appointment management
- Queue operations with live updates using Socket.IO
- Doctor and receptionist workspaces for queue handling
- Patient profile management with documents, prescriptions, reports, and billing records
- Doctor profile management and staff assignment flow

## Tech stack

### Frontend
- React 19
- Vite
- Redux Toolkit
- React Router
- Tailwind CSS
- Socket.IO client
- Lucide icons

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- Cloudinary for file uploads
- JWT and cookies for auth
- Nodemailer for email workflows

## Current app structure

```text
MedManage/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   ├── utils/
│   ├── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
├── README.md
└── package.json (root, currently minimal project-level documentation)
```

## Main features already implemented

### Authentication and user roles
- OTP-based registration and verification
- Login/logout flow
- Google registration/login support
- Role-based routing for patient, doctor, and receptionist pages

### Patient features
- Search doctors by specialty and availability
- View doctor profiles and consultation details
- Book appointments and manage bookings
- View personal profile information
- Manage medical documents, prescriptions, reports, and bills

### Doctor features
- Doctor profile update and staff assignment
- View assigned reception staff
- Access patient information from queue entries
- Manage queue status and token flow
- Open doctor physical and video dashboard workspaces

### Receptionist features
- Manage serving doctors
- Search and assign doctors
- Handle requests and assignment workflows
- Monitor queue operations for assigned doctors

### Queue and live updates
- Queue snapshot and live change handling
- Live patient/doctor queue synchronization with Socket.IO
- Offline fallback refresh polling when live connection is unavailable
- Patient now-serving summary and waiting count updates

## Environment variables

The backend expects environment variables such as:

```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

The frontend also uses `VITE_API_URL` as the backend API base URL, including the `/api/v1` path (for example, `https://api.example.com/api/v1`). If it is omitted locally, requests use `http://localhost:3000/api/v1`.

Depending on your email or auth setup, additional variables may also be required for OTP and mail sending.

## Running the project

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

The frontend will usually run on:

- http://localhost:5173

The backend server will usually run on:

- http://localhost:3000

## Notes

- The project currently uses a role-based and feature-oriented architecture rather than a single generic dashboard.
- The live queue system is one of the more mature parts of the app and is built around socket events such as `queue:join`, `queue:changed`, and `now:serving`.
- The frontend includes a temporary socket testing route for development validation.

## Recommended next steps

- Add a proper project setup section with .env examples for each service
- Add a test suite for auth, booking, and queue flows
- Improve documentation for API routes and role permissions
- Clean up development-only routes and temporary testing endpoints before production release

## License

This project is currently not documentated with a formal license in the repository.
