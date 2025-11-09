'use strict';

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const { connectDB } = require('./db');

const vehiclesRoutes = require('./routes/vehicles');
const usersRoutes = require('./routes/users');
const reservationsRoutes = require('./routes/reservation');

const init = async () => {
  try {
    await connectDB();

    const server = Hapi.server({
      port: process.env.PORT || 3000,
      host: process.env.HOST || '0.0.0.0'
    });

    server.auth.scheme('jwtAuth', function () {
      return {
        authenticate: async function (request, h) {
          try {
            const authHeader = request.headers.authorization;
            if (!authHeader) throw Boom.unauthorized('Missing token');

            const token = authHeader.replace('Bearer ', '');
            const payload = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(payload.sub);
            if (!user) throw Boom.unauthorized('User not found');

            return h.authenticated({ credentials: user });
          } catch (err) {
            throw Boom.unauthorized();
          }
        }
      };
    });

    server.auth.strategy('jwt', 'jwtAuth');

    server.route(vehiclesRoutes);
    server.route(usersRoutes);
    server.route(reservationsRoutes);

    await server.start();
    console.log('Server running on %s', server.info.uri);
  } catch (err) {
    console.error('Server error:', err);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
