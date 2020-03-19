const users = require('../controllers/users.server.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users/register')
        .post(users.register);
    app.route(app.rootUrl + '/users/login')
        .post(users.login);
    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);
    app.route(app.rootUrl + '/users/:user_id')
        .get(users.viewUser)
        .patch(users.updateUser);
    app.route(app.rootUrl + '/users/:user_id/photo')
        .get(users.viewPhoto)
        .put(users.addPhoto)
        .delete(users.deletePhoto);
};