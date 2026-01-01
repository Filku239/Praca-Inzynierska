const Activity = require('../models/activity');
const Joi = require('joi');

module.exports = [{
        method: 'GET',
        path: '/activities',
        options: {
            auth: false,
            tags: ['api', 'activities'],
            description: 'Pobierz wszystkie aktywności',
            notes: 'Zwraca wszystkie aktywności wraz z informacjami o użytkowniku i pojeździe'
        },
        handler: async (request, h) => {
            const activities = await Activity.find().populate('user').populate('vehicle');
            return activities;
        }
    },
    {
        method: 'POST',
        path: '/activities',
        options: {
            auth: 'jwt',
            tags: ['api', 'activities'],
            description: 'Dodaj nową aktywność',
            notes: 'Tworzy nową aktywność dla użytkownika i pojazdu',
            validate: {
                payload: Joi.object({
                    user: Joi.string().required(),
                    vehicle: Joi.string().required()
                })
            }
        },
        handler: async (request, h) => {
            const activity = new Activity(request.payload);
            await activity.save();
            return h.response(activity).code(201);
        }
    },
    {
        method: 'GET',
        path: '/activities/{id}',
        options: {
            auth: false,
            tags: ['api', 'activities'],
            description: 'Pobierz aktywność po ID',
            notes: 'Zwraca szczegóły jednej aktywności wraz z informacjami o użytkowniku i pojeździe',
            validate: {
                params: Joi.object({
                    id: Joi.string().required()
                })
            }
        },
        handler: async (request, h) => {
            const activity = await Activity.findById(request.params.id).populate('user').populate('vehicle');
            if (!activity) return h.response({
                message: 'Activity not found'
            }).code(404);
            return activity;
        }
    },
    {
        method: 'DELETE',
        path: '/activities/{id}',
        options: {
            auth: 'jwt',
            tags: ['api', 'activities'],
            description: 'Usuń aktywność',
            notes: 'Usuwa aktywność po ID',
            validate: {
                params: Joi.object({
                    id: Joi.string().required()
                })
            }
        },
        handler: async (request, h) => {
            const result = await Activity.findByIdAndDelete(request.params.id);
            if (!result) return h.response({
                message: 'Activity not found'
            }).code(404);
            return h.response({
                message: 'Activity deleted'
            }).code(200);
        }
    },
    {
        method: 'GET',
        path: '/activities/user/{id}',
        options: {
            auth: false,
            tags: ['api', 'activities'],
            description: 'Pobierz aktywności użytkownika',
            notes: 'Zwraca wszystkie aktywności konkretnego użytkownika wraz z informacjami o pojazdach',
            validate: {
                params: Joi.object({
                    id: Joi.string().required()
                })
            }
        },
        handler: async (request, h) => {
            const userId = request.params.id;
            const activities = await Activity.find({
                user: userId
            }).populate('vehicle');
            return activities;
        }
    }
];