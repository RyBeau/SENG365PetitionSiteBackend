const petitions = require('../controllers/petitions.server.controller');

module.exports = function (app) {
    app.route("/api/v1/petitions")
        .get(petitions.viewAll)
        .post();
    app.route("/api/v1/petitions/:id")
        .get()
        .patch()
        .delete();
    app.route("/api/v1/petitions/catergories")
        .get();
};