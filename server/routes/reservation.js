const requireOwnReservation = require('../middlewares/reservationCheck.js');
const Reservation = require('../models/reservation');

module.exports = [{
        method: 'POST',
        path: '/reservations',
        options: {
            auth: 'jwt',
            tags: ['api', 'reservations'],
            description: 'Utwórz nową rezerwację',
            notes: 'Tworzy nową rezerwację pojazdu dla zalogowanego użytkownika',
            validate: {
                payload: require('joi').object({
                    vehicleId: require('joi').string().required(),
                    startDate: require('joi').date().required(),
                    endDate: require('joi').date().required(),
                    cost: require('joi').number().required()
                })
            }
        },
        handler: async (request, h) => {
            try {
                const {
                    vehicleId,
                    startDate,
                    endDate,
                    cost
                } = request.payload;
                const reservation = new Reservation({
                    vehicle: vehicleId,
                    startDate,
                    endDate,
                    user: request.auth.credentials.id,
                    cost
                });
                await reservation.save();
                return h.response({
                    message: 'Reservation created successfully'
                }).code(201);
            } catch (err) {
                console.error('Reservation error:', err);
                return h.response({
                    message: 'Internal server error'
                }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/reservations',
        options: {
            tags: ['api', 'reservations'],
            description: 'Pobierz wszystkie rezerwacje',
            notes: 'Zwraca listę wszystkich rezerwacji wraz z informacją o pojeździe'
        },
        handler: async (request, h) => {
            const reservations = await Reservation.find().populate('vehicle');
            return reservations;
        }
    },
    {
        method: 'GET',
        path: '/reservations/{id}',
        options: {
            tags: ['api', 'reservations'],
            description: 'Pobierz rezerwację po ID',
            notes: 'Zwraca szczegóły jednej rezerwacji wraz z informacjami o pojeździe',
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                })
            }
        },
        handler: async (request, h) => {
            const id = request.params.id;
            const reservation = await Reservation.findById(id).populate('vehicle');
            if (!reservation) return h.response({
                message: 'Reservation not found'
            }).code(404);
            return reservation;
        }
    },
    {
        method: 'PUT',
        path: '/reservations/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'reservations'],
            description: 'Edytuj rezerwację',
            notes: 'Pozwala edytować daty rezerwacji; tylko właściciel lub admin',
            pre: [requireOwnReservation()],
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                }),
                payload: require('joi').object({
                    startDate: require('joi').date().required(),
                    endDate: require('joi').date().required()
                })
            }
        },
        handler: async (request, h) => {
            const id = request.params.id;
            const {
                startDate,
                endDate
            } = request.payload;
            const reservation = await Reservation.findByIdAndUpdate(id, {
                startDate,
                endDate
            }, {
                new: true
            }).populate('vehicle');
            if (!reservation) return h.response({
                message: 'Reservation not found'
            }).code(404);
            return reservation;
        }
    },
    {
        method: 'DELETE',
        path: '/reservations/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'reservations'],
            description: 'Usuń rezerwację',
            notes: 'Usuwa rezerwację; tylko właściciel lub admin',
            pre: [requireOwnReservation()],
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                })
            }
        },
        handler: async (request, h) => {
            const id = request.params.id;
            const reservation = await Reservation.findByIdAndDelete(id);
            if (!reservation) return h.response({
                message: 'Reservation not found'
            }).code(404);
            return h.response({
                message: 'Reservation deleted successfully'
            }).code(200);
        }
    },
    {
        method: 'GET',
        path: '/reservations/user/{id}',
        options: {
            tags: ['api', 'reservations'],
            description: 'Pobierz rezerwacje użytkownika',
            notes: 'Zwraca wszystkie rezerwacje konkretnego użytkownika',
            validate: {
                params: require('joi').object({
                    id: require('joi').string().required()
                })
            }
        },
        handler: async (request, h) => {
            const id = request.params.id;
            const reservations = await Reservation.find({
                user: id
            }).populate('vehicle');
            return reservations;
        }
    }
];