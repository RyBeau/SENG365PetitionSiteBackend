const petitions = require('../controllers/petitions.server.controller');

module.exports = function (app) {
    app.route(app.rootUrl + "/petitions/categories")
        .get(petitions.getCategories);
    app.route(app.rootUrl + "/petitions")
        .get(petitions.viewAll)
        .post(petitions.addPetition);
    app.route(app.rootUrl + "/petitions/:petition_id")
        .get(petitions.viewOne)
        .patch(petitions.updatePetition)
        .delete(petitions.deletePetition);
};