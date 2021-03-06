const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const { allowCrossOriginRequestsMiddleware } = require('../app/middleware/cors.middleware');


module.exports = function () {
    // INITIALISE EXPRESS //
    const app = express();
    app.rootUrl = '/api/v1';

    // MIDDLEWARE
    app.use(allowCrossOriginRequestsMiddleware);
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.raw({ type: 'text/plain', limit: '50mb' }));  // for the /executeSql endpoint
    app.use(bodyParser.raw({ type: 'image/*', limit: '50mb' }));

    app.use(cors());

    // DEBUG (you can remove these)
    app.use((req, res, next) => {
        console.log(`##### ${req.method} ${req.path} #####`);
        next();
    });

    app.get('/', function (req, res) {
        res.send({ 'message': 'Hello World!' })
    });

    // ROUTES
    require('../app/routes/backdoor.routes')(app);
    require('../app/routes/users.server.routes')(app);
    require('../app/routes/petitions.server.routes')(app);
    return app;
};
