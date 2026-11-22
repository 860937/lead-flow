// Vercel Serverless Function Entry Point
// This file adapts the Express app for Vercel's serverless environment

process.env.VERCEL = '1'; // signal to database.js to use /tmp storage

const app = require('../server/server');

module.exports = app;
