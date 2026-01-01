const Vehicle = require('../models/vehicle');
const Reservation = require('../models/reservation');
const User = require('../models/user');

const isAdmin = async (request) => {
    const userId = request.auth.credentials.id;
    const user = await User.findById(userId);
    return user && user.role === 'admin';
};

const adminRoutes = [{
        method: 'GET',
        path: '/admin/stats',
        options: {
            auth: 'jwt',
            tags: ['api', 'admin'],
            description: 'Pobierz statystyki systemu',
            notes: 'Zwraca liczbę pojazdów, użytkowników i rezerwacji; dostęp tylko dla administratora'
        },
        handler: async (request, h) => {
            if (!await isAdmin(request)) return h.response({
                message: 'Brak dostępu'
            }).code(403);
            try {
                const vehicleCount = await Vehicle.countDocuments({});
                const userCount = await User.countDocuments({});
                const reservationCount = await Reservation.countDocuments({});
                return {
                    vehicles: vehicleCount,
                    users: userCount,
                    reservations: reservationCount
                };
            } catch (err) {
                return h.response({
                    message: 'Błąd serwera podczas pobierania statystyk'
                }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/admin/users',
        options: {
            auth: 'jwt',
            tags: ['api', 'admin'],
            description: 'Pobierz wszystkich użytkowników',
            notes: 'Zwraca listę wszystkich użytkowników; dostęp tylko dla administratora'
        },
        handler: async (request, h) => {
            if (!await isAdmin(request)) return h.response({
                message: 'Brak dostępu'
            }).code(403);
            const users = await User.find({});
            return users;
        }
    },
    {
        method: 'DELETE',
        path: '/admin/users/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'admin'],
            description: 'Usuń użytkownika',
            notes: 'Usuwa użytkownika oraz wszystkie jego pojazdy i rezerwacje; dostęp tylko dla administratora',
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                })
            }
        },
        handler: async (request, h) => {
            if (!await isAdmin(request)) return h.response({
                message: 'Brak dostępu'
            }).code(403);
            const id = request.params.id;
            await Vehicle.deleteMany({
                ownerId: id
            });
            await Reservation.deleteMany({
                userId: id
            });
            await User.findByIdAndDelete(id);
            return {
                message: 'Usunięto użytkownika'
            };
        }
    },
    {
        method: 'PATCH',
        path: '/admin/users/{id}/role',
        options: {
            auth: 'jwt',
            tags: ['api', 'admin'],
            description: 'Zmień rolę użytkownika',
            notes: 'Pozwala administratorowi zmienić rolę użytkownika',
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                }),
                payload: require('joi').object({
                    role: require('joi').string().required()
                })
            }
        },
        handler: async (request, h) => {
            if (!await isAdmin(request)) return h.response({
                message: 'Brak dostępu'
            }).code(403);
            const id = request.params.id;
            const {
                role
            } = request.payload;
            await User.findByIdAndUpdate(id, {
                role
            });
            return {
                message: 'Zmieniono rolę'
            };
        }
    },
    {
        method: 'PATCH',
        path: '/admin/users/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'admin'],
            description: 'Aktualizuj dane użytkownika',
            notes: 'Pozwala administratorowi zaktualizować dane użytkownika',
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                }),
                payload: require('joi').object().unknown(true)
            }
        },
        handler: async (request, h) => {
            if (!await isAdmin(request)) return h.response({
                message: 'Brak dostępu'
            }).code(403);
            const id = request.params.id;
            const data = request.payload;
            await User.findByIdAndUpdate(id, data);
            return {
                message: 'Zaktualizowano użytkownika'
            };
        }
    }
];

module.exports = adminRoutes;