'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const config = require('./config/app');

// Support multiple CORS origins from a comma-separated env variable
const allowedOrigins = (config.cors.origin)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const path = require('path');

const app = express();

app.use(helmet());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(compression());

if (config.app.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/api/public', cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}), require('./routes/public'));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

app.use('/api', routes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
