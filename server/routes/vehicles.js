const Vehicle = require('../models/vehicle');
const Reservation = require('../models/reservation');
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

module.exports = [
  
  {
    method: 'GET',
    path: '/vehicles',
    handler: async (request, h) => {
      const vehicles = await Vehicle.find({ available: true, accepted: true });
      return vehicles;
    }
  },
  {
    method: 'POST',
    path: '/vehicles',
    handler: async (request, h) => {  
      const vehicle = new Vehicle({ ...request.payload, accepted: true });
      await vehicle.save();
      return { message: 'Vehicle added', id: vehicle._id };
    }
  },
  {
    method: 'GET',
    path: '/vehicles/{id}',
    handler: async (request, h) => {
      const vehicle = await Vehicle.findById(request.params.id);
      return vehicle;
    }
  },
  {
    method: 'PUT',
    path: '/vehicles/{id}',
    handler: async (request, h) => {
      const vehicle = await Vehicle.findByIdAndUpdate(request.params.id, request.payload, { new: true });
      return vehicle;
    }
  },
  {
    method: 'DELETE',
    path: '/vehicles/{id}',
    handler: async (request, h) => {
      const vehicle = await Vehicle.findByIdAndDelete(request.params.id);
      return vehicle;
    }
  },
  {
  method: 'GET',
  path: '/vehicles/{id}/reservations',

  handler: async (request, h) => {
    const vehicleId = request.params.id;
    const reservations = await Reservation.find({ vehicle: vehicleId })
      .select('startDate endDate')
      .lean();

    const clean = reservations.map(r => {
        const start = r.startDate;
        const end = r.endDate;

        const startISO = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;
        const endISO = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`;
        
        return {
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
    handler: async (request, h) => {
      const vehicles = await Vehicle.find({ accepted: true });
      return vehicles;
    }
  }
];
