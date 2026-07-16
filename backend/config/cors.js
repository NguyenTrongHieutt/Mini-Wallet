module.exports.cors = {
  allRoutes: true,
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://localhost:8080',
  credentials: true,
  methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  headers: 'content-type, authorization, x-requested-with'
};
