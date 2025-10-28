const Vehicle = require('../models/vehicle');

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
      const vehicle = new Vehicle(request.payload);
      await vehicle.save();
      return { message: 'Vehicle added', id: vehicle._id };
    }
  }
];
