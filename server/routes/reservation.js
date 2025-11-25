const requireOwnReservation = require('../middlewares/reservationCheck');
const Reservation = require('../models/reservation');

module.exports = [
  {
  method: 'POST',
  path: '/reservations',
  options: {
    auth: 'jwt'
  },
  handler: async (request, h) => {
    try {
      const { vehicleId, startDate, endDate, cost } = request.payload;

      if (!vehicleId || !startDate || !endDate || !cost) {
        return h.response({ message: 'Brak wymaganych danych' }).code(400);
      }

      const reservation = new Reservation({
        vehicle: vehicleId,             
        startDate,
        endDate,
        user: request.auth.credentials.id,
        cost
      });

      await reservation.save();

      return h.response({ message: 'Reservation created successfully' }).code(201);
    } catch (err) {
      console.error('Reservation error:', err);
      return h.response({ message: 'Internal server error' }).code(500);
    }
  }
},
  {
    method: 'GET',
    path: '/reservations',
    handler: async (request, h) => {
      const reservations = await Reservation.find().populate('vehicleId');
      return reservations;
    }
  },
  {
    method: 'GET',
    path: '/reservations/{id}',
    handler: async (request, h) => {
      const id = request.params.id;
      const reservation = await Reservation.findById(id).populate('vehicleId');
      if (!reservation) {
        return h.response({ message: 'Reservation not found' }).code(404);
      }
      return reservation;
    }
  },
  {
    method: 'PUT',
    path: '/reservations/{id}',
    options: {
      pre:[requireOwnReservation()]
    },
    handler: async (request, h) => {
      const id = request.params.id;
      const { startDate, endDate } = request.payload;
      const reservation = await Reservation.findByIdAndUpdate(id, { startDate, endDate }, { new: true });
      if (!reservation) {
        return h.response({ message: 'Reservation not found' }).code(404);
      }
      return reservation;
    }
  },
  {
    method: 'DELETE',
    path: '/reservations/{id}',
    options: {
      pre:[requireOwnReservation()]
    },    
    handler: async (request, h) => {
      const id = request.params.id;
      const reservation = await Reservation.findByIdAndRemove(id);
      if (!reservation) {
        return h.response({ message: 'Reservation not found' }).code(404);
      }
      return h.response({ message: 'Reservation deleted successfully' }).code(200);
    }
  }
]
