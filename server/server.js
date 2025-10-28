'use strict';

const Hapi = require('@hapi/hapi');
const db = require('./db');
const vehicles = require('./routes/vehicles');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.db = await db.connectDB();

    server.route(vehicles);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();