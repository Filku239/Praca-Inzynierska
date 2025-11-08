const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = [
    {
        method: 'POST',
        path: '/users/login',
        handler: async (request, h) => {
           const {username, email, password } = request.payload;
           const user = await User.findOne({ email: email });
           if (!user) {
               return h.response({ message: 'User not found' }).code(404);
           }
           const isPasswordValid = await bcrypt.compare(password, user.password);
           if (!isPasswordValid) {
               return h.response({ message: 'Invalid password' }).code(401);
           }
            const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });
           return h.response({ token }).code(200);
        }
    },
 {
    method: 'POST',
    path: '/users/register',
    handler: async (request, h) => {
      try {
        const { username, email, password } = request.payload;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
          return h
            .response({
              status: 'error',
              code: 'USER_EXISTS',
              message: 'Użytkownik z takim e-mailem lub nazwą już istnieje.',
            })
            .code(409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        return h
          .response({
            status: 'success',
            message: 'Użytkownik został zarejestrowany pomyślnie.',
            user: { id: user._id, username: user.username, email: user.email },
          })
          .code(201);
      } catch (err) {
        console.error(err);
        return h
          .response({
            status: 'error',
            code: 'SERVER_ERROR',
            message: 'Wystąpił błąd podczas rejestracji użytkownika.',
          })
          .code(500);
      }
    },
  }
];

