const Boom = require('@hapi/boom');
const Reservation = require('../models/reservation');
const Vehicle = require('../models/vehicle');

async function checkOwnReservation(request, h) {
  if (!request.auth || !request.auth.credentials) {
    throw Boom.unauthorized('Missing credentials');
  }

  const userId = request.auth.credentials.id;
  const isAdmin = request.auth.credentials.role === 'admin';
  const { id } = request.params;

  if (!id) throw Boom.badRequest('Reservation ID is missing');

  let reservation;
  try {
    reservation = await Reservation.findById(id);
    if (!reservation) throw Boom.notFound('Reservation not found');
  } catch (err) {
    if (err.name === 'CastError') {
      throw Boom.badRequest('Invalid reservation ID format');
    }
    console.error('Error finding reservation:', err);
    throw Boom.badImplementation('Database error');
  }

  if (isAdmin) return h.continue;

  if (reservation.user && reservation.user.equals(userId)) return h.continue;

  let vehicle;
  try {
    vehicle = await Vehicle.findById(reservation.vehicle);
  } catch (err) {
    if (err.name === 'CastError') {
      throw Boom.badRequest('Invalid vehicle ID');
    }
    throw Boom.badImplementation('Database error');
  }

  if (vehicle && vehicle.user && vehicle.user.equals(userId)) return h.continue;

  throw Boom.forbidden('Access denied');
}

module.exports = checkOwnReservation; 