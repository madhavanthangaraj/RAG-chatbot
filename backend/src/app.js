const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const swaggerRoutes = require('./routes/swagger.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const loggingMiddleware = require('./middlewares/logging.middleware');

const app = express();

app.set('trust proxy', 1);

// Global Rate Limiting: max 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

app.use(limiter);
app.use(cors());
app.use(express.json());

app.use(loggingMiddleware);

// Swagger Docs Endpoint
app.use('/api-docs', swaggerRoutes);

app.use('/api', routes);

app.use(errorMiddleware);

module.exports = app;
