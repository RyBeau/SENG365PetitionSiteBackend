const users = require('../controllers/users.server.controller');

module.exports = function (app) {
    app.route('/users/register')
        .post(users.register);
};