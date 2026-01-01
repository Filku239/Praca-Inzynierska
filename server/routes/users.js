    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const Joi = require('joi');
    const User = require('../models/user');
    const Vehicle = require('../models/vehicle');
    const Reservation = require('../models/reservation');

    const AUTH_STRATEGY = 'jwt'; 

    const deleteUserAuthorization = (request, h) => {
        const targetUserId = request.params.id;
        const loggedInUserId = request.auth.credentials.id; 
        const loggedInUserRole = request.auth.credentials.role;

        const isTargetSelf = String(loggedInUserId) === String(targetUserId);
        const isAdmin = loggedInUserRole === 'admin';

        if (isAdmin || isTargetSelf) {
            return h.continue;
        }

        return h.response({ 
            statusCode: 403, 
            error: 'Forbidden', 
            message: 'Brak uprawnień do wykonania tej akcji.' 
        }).code(403).takeover();
    };

    const deleteUserHandler = async (request, h) => {
        try {
            const targetUserId = request.params.id;
            await Vehicle.deleteMany({ ownerId: targetUserId });
            await Reservation.deleteMany({ userId: targetUserId });
            const result = await User.deleteOne({ _id: targetUserId });

            if (result.deletedCount === 0) {
                return h.response({ message: 'Użytkownik nie został znaleziony.' }).code(404);
            }

            return h.response({ message: 'Użytkownik został pomyślnie usunięty.' }).code(200);

        } catch (err) {
            console.error('Błąd usuwania użytkownika:', err);
            return h.response({ 
                status: 'error', 
                message: 'Wystąpił błąd serwera podczas usuwania użytkownika.' 
            }).code(500);
        }
    };

    const changePasswordAuthorization = (request, h) => {
        const targetUserId = request.params.id;
        const loggedInUserId = request.auth.credentials.id;
        const loggedInUserRole = request.auth.credentials.role;

        const isSelf = String(targetUserId) === String(loggedInUserId);
        const isAdmin = loggedInUserRole === 'admin';

        if (isSelf || isAdmin) return h.continue;

        return h
            .response({ message: "Brak uprawnień do zmiany hasła." })
            .code(403)
            .takeover();
    };

    const changePasswordHandler = async (request, h) => {
        const userId = request.params.id;
        const { oldPassword, newPassword } = request.payload;

        try {
            const user = await User.findById(userId);

            if (!user) {
                return h.response({ message: "Użytkownik nie istnieje." }).code(404);
            }

            const isAdmin = request.auth.credentials.role === 'admin';

            if (!isAdmin) {
                const validOld = await bcrypt.compare(oldPassword, user.password);
                if (!validOld) {
                    return h.response({ message: "Nieprawidłowe stare hasło." }).code(400);
                }
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            user.password = hashed;
            await user.save();

            return h.response({ message: "Hasło zostało zmienione." }).code(200);

        } catch (err) {
            console.error("Błąd zmiany hasła:", err);
            return h.response({ message: "Błąd serwera." }).code(500);
        }
    };

    module.exports = [
        {
            method: 'POST',
            path: '/users/login',
            options: {
                tags: ['api', 'users'],
                description: 'Logowanie użytkownika',
                notes: 'Zwraca token JWT oraz dane użytkownika po poprawnym zalogowaniu',
                validate: {
                    payload: Joi.object({
                        email: Joi.string().email().required(),
                        password: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                const { email, password } = request.payload;
                const user = await User.findOne({ email: email });

                if (!user) return h.response({ message: 'Nieprawidłowy e-mail lub hasło' }).code(401);
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) return h.response({ message: 'Nieprawidłowy e-mail lub hasło' }).code(401);

                const token = jwt.sign(
                    { sub: user._id.toString(), id: user._id.toString(), role: user.role }, 
                    process.env.JWT_SECRET, 
                    { expiresIn: '15m' }
                );

                return h.response({ 
                    token, 
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    id: user._id
                }).code(200);
            }
        },
        {
            method: 'POST',
            path: '/users/register',
            options: {
                tags: ['api', 'users'],
                description: 'Rejestracja nowego użytkownika',
                notes: 'Tworzy nowego użytkownika i zapisuje w bazie danych',
                validate: {
                    payload: Joi.object({
                        username: Joi.string().min(3).required(),
                        email: Joi.string().email().required(),
                        password: Joi.string().min(6).required()
                    })
                }
            },
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
                    const user = new User({ username, email, password: hashedPassword, role: 'user' }); 
                    await user.save();

                    return h
                        .response({
                            status: 'success',
                            message: 'Użytkownik został zarejestrowany pomyślnie.',
                            user: { id: user._id, username: user.username, email: user.email, role: user.role },
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
        },
        {
            method: 'DELETE',
            path: '/users/{id}',
            options: {
                tags: ['api', 'users'],
                description: 'Usuń użytkownika',
                notes: 'Usuwa użytkownika i jego powiązane dane, wymaga uprawnień administratora lub samego użytkownika',
                auth: AUTH_STRATEGY,
                validate: {
                    params: Joi.object({
                        id: Joi.string().required()
                    })
                },
                pre: [
                    { method: deleteUserAuthorization, assign: 'authCheck' } 
                ],
                handler: deleteUserHandler
            }
        },
        {
            method: 'PUT',
            path: '/users/{id}/password',
            options: {
                tags: ['api', 'users'],
                description: 'Zmień hasło użytkownika',
                notes: 'Umożliwia zmianę hasła, wymaga uprawnień administratora lub właściciela konta',
                auth: AUTH_STRATEGY,
                validate: {
                    params: Joi.object({ id: Joi.string().required() }),
                    payload: Joi.object({ oldPassword: Joi.string().required(), newPassword: Joi.string().min(6).required() })
                },
                pre: [
                    { method: changePasswordAuthorization }
                ],
                handler: changePasswordHandler
            }
        },
        {
            method: 'POST',
            path: '/users/admin/login',
            options: {
                tags: ['api', 'users'],
                description: 'Logowanie administratora',
                notes: 'Logowanie tylko dla konta z rolą admin, zwraca token JWT i dane administratora',
                validate: {
                    payload: Joi.object({
                        email: Joi.string().email().required(),
                        password: Joi.string().required()
                    })
                }
            },
            handler: async (request, h) => {
                const { email, password } = request.payload;
                try {
                    const user = await User.findOne({ email });
                    if (!user) return h.response({ message: 'Nieprawidłowy e-mail lub hasło' }).code(401);

                    const isPasswordValid = await bcrypt.compare(password, user.password);
                    if (!isPasswordValid) return h.response({ message: 'Nieprawidłowy e-mail lub hasło' }).code(401);

                    if (user.role !== 'admin') return h.response({ message: 'Dostęp tylko dla administratora.' }).code(403);

                    const token = jwt.sign(
                        { sub: user._id.toString(), id: user._id.toString(), role: user.role },
                        process.env.JWT_SECRET,
                        { expiresIn: '15m' }
                    );

                    return h.response({
                        token,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        id: user._id
                    }).code(200);
                } catch (err) {
                    console.error('Błąd logowania admina:', err);
                    return h.response({ message: 'Błąd serwera' }).code(500);
                }
            }
        }
    ];
