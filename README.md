# RentEase

A simple MERN (MongoDB, Express, React, Node.js) application for browsing and managing rental properties.

## Features

- Browse property listings and filter by city, price range, and number of rooms
- View property details and contact the owner
- Register and log in with JSON Web Token authentication
- Admin dashboard for managing properties and viewing messages
- Upload property images

## Requirements

- Node.js and npm
- MongoDB running locally or a MongoDB Atlas connection string

## Setup

### 1. Configure the backend

Create `backend/.env` with your MongoDB connection string and a secret used to sign authentication tokens:

```env
MONGO_URI=mongodb://127.0.0.1:27017/property-rental
JWT_SECRET=replace-this-with-a-long-random-secret
PORT=5000
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string. Make sure the database is available before starting the server.

In a terminal, install dependencies and start the backend:

```sh
cd backend
npm install
npm run dev
```

The API runs at `http://localhost:5000` by default. Uploaded images are stored in `backend/uploads/` and served from `/uploads`.

### 2. Start the frontend

In a second terminal from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The frontend currently sends API requests to `http://localhost:5000`.

## Development Notes

- The frontend uses React, React Router, Axios, and Vite.
- The backend uses Express, Mongoose, JWT, and Multer.
- Admin accounts can currently be selected during registration. This is convenient for local development, but must be restricted before deploying the application.
- Frontend checks: run `npm run lint` or `npm run build` from `frontend/`.
- The backend package does not currently define an automated test suite.
