const petitions = require('../controllers/petitions.server.controller');

module.exports = function (app) {
    app.route("/api/v1/petitions")
        .get()
        .post(petitions.addPetition);
    app.route("/api/v1/petitions/:petition_id")
        .get(petitions.viewOne)
        .patch()
        .delete();
    app.route("/api/v1/petitions/catergories")
        .get();
};