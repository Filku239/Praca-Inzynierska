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
