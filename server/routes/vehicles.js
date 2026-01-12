const Vehicle = require('../models/vehicle');
const Reservation = require('../models/reservation');
const Activity = require('../models/activity');
const User = require('../models/user');
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

module.exports = [{
        method: 'GET',
        path: '/vehicles',
        options: {
            tags: ['api', 'vehicles'],
            description: 'Pobierz wszystkie dostępne i zaakceptowane pojazdy',
            notes: 'Zwraca listę pojazdów, które są dostępne i zaakceptowane w systemie'
        },
        handler: async (request, h) => {
            const vehicles = await Vehicle.find();
            return vehicles;
        }
    },
    {
        method: 'POST',
        path: '/vehicles',
        options: {
            auth: 'jwt',
            tags: ['api', 'vehicles'],
            description: 'Dodaj nowy pojazd',
            notes: 'Tworzy nowy pojazd z danymi z payload; pojazd początkowo niezaakceptowany'
        },
        handler: async (request, h) => {
            const vehicle = new Vehicle({
                ...request.payload,
                accepted: false
            });
            await vehicle.save();
            return {
                message: 'Vehicle added',
                id: vehicle._id
            };
        }
    },
    {
        method: 'GET',
        path: '/vehicles/{id}',
        options: {
            tags: ['api', 'vehicles'],
            description: 'Pobierz pojazd po ID',
            notes: 'Zwraca szczegóły konkretnego pojazdu'
        },
        handler: async (request, h) => {
            try {
                const vehicle = await Vehicle.findById(request.params.id).lean();
                if (!vehicle) return h.response({
                    message: 'Pojazd nie znaleziony'
                }).code(404);
                return vehicle;
            } catch (err) {
                console.error('Błąd pobierania pojazdu:', err);
                return h.response({
                    message: 'Błąd serwera'
                }).code(500);
            }
        }
    },
    {
        method: 'PUT',
        path: '/vehicles/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'vehicles'],
            description: 'Aktualizuj pojazd',
            notes: 'Aktualizuje dane pojazdu o podanym ID'
        },
        handler: async (request, h) => {
            const vehicle = await Vehicle.findByIdAndUpdate(request.params.id, request.payload, {
                new: true
            });
            return vehicle;
        }
    },
    {
        method: 'DELETE',
        path: '/vehicles/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'vehicles'],
            description: 'Usuń pojazd',
            notes: 'Usuwa pojazd o podanym ID oraz wszystkie jego rezerwacje'
        },
        handler: async (request, h) => {
            await Reservation.deleteMany({
                vehicle: request.params.id
            });
            const vehicle = await Vehicle.findByIdAndDelete(request.params.id);
            return vehicle;
        }
    },
    {
        method: 'GET',
        path: '/vehicles/{id}/reservations',
        options: {
            tags: ['api', 'vehicles'],
            description: 'Pobierz rezerwacje pojazdu',
            notes: 'Zwraca listę rezerwacji pojazdu w formacie daty ISO'
        },
        handler: async (request, h) => {
            const vehicleId = request.params.id;
            const reservations = await Reservation.find({
                    vehicle: vehicleId
                })
                .select('startDate endDate')
                .lean();

            const clean = reservations.map(r => {
                const start = r.startDate;
                const end = r.endDate;

                const startISO = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;
                const endISO = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`;

                return {
                    _id: r._id,
                    startDate: startISO,
                    endDate: endISO,
                };
            });

            return clean;
        }
    },
    {
        method: 'POST',
        path: '/vehicles/{id}/rental',
        options: {
            auth: 'jwt',
            tags: ['api', 'vehicles'],
            description: 'Zaakceptuj wynajem pojazdu',
            notes: 'Ustawia parametr accepted na true dla podanego pojazdu'
        },
        handler: async (request, h) => {
            const vehicle = await Vehicle.findById(request.params.id);
            vehicle.accepted = true;
            await vehicle.save();
            return vehicle;
        }
    },
    {
        method: 'GET',
        path: '/vehicles/accepted',
        options: {
            tags: ['api', 'vehicles'],
            description: 'Pobierz wszystkie zaakceptowane pojazdy',
            notes: 'Zwraca listę pojazdów, które mają accepted = true'
        },
        handler: async (request, h) => {
            const vehicles = await Vehicle.find({
                accepted: true
            });
            return vehicles;
        }
    },
    {
        method: 'GET',
        path: '/vehicles/user/{userId}',
        options: {
            auth: 'jwt',
            tags: ['api', 'vehicles'],
            description: 'Pobierz pojazdy użytkownika',
            notes: 'Zwraca wszystkie pojazdy przypisane do konkretnego użytkownika'
        },
        handler: async (request, h) => {
            try {
                const {
                    userId
                } = request.params;
                const vehicles = await Vehicle.find({
                    user: userId
                });
                return vehicles;
            } catch (err) {
                console.error('Błąd pobierania pojazdów użytkownika:', err);
                return h.response({
                    message: 'Nie udało się pobrać pojazdów użytkownika'
                }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/vehicles/popular',
        options: {
            tags: ['api', 'vehicles'],
            description: 'Pobierz najpopularniejsze pojazdy na podstawie aktywności'
        },
        handler: async (request, h) => {
            const popularData = await Activity.aggregate([{
                    $group: {
                        _id: "$vehicle",
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                },
                {
                    $limit: 6
                }
            ]);

            const vehicleIds = popularData.map(item => item._id);

            const vehicles = await Vehicle.find({
                _id: {
                    $in: vehicleIds
                },
                accepted: true
            });

            return vehicles;
        }
    },
    {
        method: 'GET',
        path: '/stats',
        options: {
            tags: ['api', 'stats'],
            description: 'Pobierz ogólne statystyki systemu'
        },
        handler: async (request, h) => {
            try {
                const vehiclesCount = await Vehicle.countDocuments({
                    accepted: true
                });
                const usersCount = await User.countDocuments();

                const uniqueCities = await Vehicle.distinct('location', {
                    accepted: true
                });

                return {
                    vehicles: vehiclesCount,
                    users: usersCount,
                    cities: uniqueCities.length
                };
            } catch (err) {
                return h.response({
                    message: 'Błąd statystyk'
                }).code(500);
            }
        }
    }
];