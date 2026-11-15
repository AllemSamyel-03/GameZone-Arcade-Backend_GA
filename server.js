const express = require('express');
const { initDatabase } = require('./db/database');
const consolesRouter = require('./routes/consoles');
const gamersRouter = require('./routes/gamers');
const bookingsRouter = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger for debugging and grading visibility
app.use((req, res, next) => {
  const now = new Date().toISOString().slice(11, 19);
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root / Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    project: "GameZone Arcade - Console Station Reservation System",
    theme: "Theme 16 of 30 · Console stations",
    course: "Backend Development Fundamentals (BDF) - Modules 1 to 3",
    status: "online",
    endpoints: {
      consoles: {
        all: "GET /consoles",
        search: "GET /consoles?platform=PlayStation",
        twist_available: "GET /consoles/available?date=YYYY-MM-DD",
        one: "GET /consoles/:id",
        create: "POST /consoles",
        update: "PUT /consoles/:id",
        delete: "DELETE /consoles/:id"
      },
      gamers: {
        all: "GET /gamers",
        one: "GET /gamers/:id",
        create: "POST /gamers",
        update: "PUT /gamers/:id",
        delete: "DELETE /gamers/:id"
      },
      bookings: {
        join_endpoint: "GET /bookings (bookings with gamer name & console name)",
        one: "GET /bookings/:id",
        create: "POST /bookings (twist validation: end_date >= start_date)",
        delete: "DELETE /bookings/:id"
      }
    }
  });
});

// Register Resource Routes
app.use('/consoles', consolesRouter);
app.use('/gamers', gamersRouter);
app.use('/bookings', bookingsRouter);

// Handle 404 for unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint '${req.method} ${req.originalUrl}' not found on GameZone Arcade server.`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[-] Server Error:', err.message);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message
  });
});

// Start server after verifying / initializing database tables
const startServer = async () => {
  try {
    await initDatabase();
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🎮 GameZone Arcade Server running on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`🕹️  Twist Endpoint: http://localhost:${PORT}/consoles/available?date=20261111`);
      console.log(`📋 Join Endpoint:  http://localhost:${PORT}/bookings`);
      console.log(`=======================================================`);
    });
    return server;
  } catch (error) {
    console.error('[-] Failed to initialize database and start server:', error);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

