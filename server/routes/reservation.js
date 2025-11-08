const requireOwnReservation = require('../middlewares/reservationCheck');
const Reservation = require('../models/reservation');

module.exports = [
  {
    method: 'POST',
    path: '/reservations',
    handler: async (request, h) => {
      const { vehicleId, startDate, endDate } = request.payload;
      const reservation = new Reservation({
        vehicleId,
        startDate,
        endDate,
        user: request.auth.credentials._id
      });
      await reservation.save();
      return h.response({ message: 'Reservation created successfully' }).code(201);
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
