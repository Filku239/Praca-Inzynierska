const Boom = require('@hapi/boom');
const Reservation = require('../models/reservation');

async function checkOwnReservation(request, h) {
  if (!request.auth || !request.auth.credentials) {
    throw Boom.unauthorized('Missing credentials');
  }

  const userId = request.auth.credentials.id;
  const isAdmin = request.auth.credentials.role === 'admin';

  const { id } = request.params;
  if (!id) throw Boom.badRequest('Reservation ID is missing');

  const reservation = await Reservation.findById(id);
  if (!reservation) throw Boom.notFound('Reservation not found');

  if (!isAdmin && !reservation.user.equals(userId)) {
    throw Boom.forbidden('Access denied');
  }

  return h.continue;
}

module.exports = () => ({ method: checkOwnReservation, assign: 'ownReservationCheck' });
