const Boom = require('@hapi/boom');
const Reservation = require('../models/reservation');

async function checkOwnReservation(request, h) {
  const { id } = request.params;
  if (!id) throw Boom.badRequest('Reservation ID is missing');

  const reservation = await Reservation.findById(id);
  if (!reservation) throw Boom.notFound('Reservation not found');

  if (!reservation.user.equals(request.auth.credentials.id)) {
    throw Boom.forbidden('Access denied');
  }
  return h.continue;
}

module.exports = () => ({ method: checkOwnReservation, assign: 'ownReservationCheck' });
