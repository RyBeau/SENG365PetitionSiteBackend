const petitions = require('../controllers/petitions.server.controller');

module.exports = function (app) {
    app.route("/api/v1/petitions/categories")
        .get(petitions.getCategories);
    app.route("/api/v1/petitions")
        .get(petitions.viewAll)
        .post(petitions.addPetition);
    app.route("/api/v1/petitions/:petition_id")
        .get(petitions.viewOne)
        .patch(petitions.updatePetition)
        .delete(petitions.deletePetition);
};