const db = require('../../config/db');

exports.getPetitions = async function () {
    const connection = db.getPool();
    const q = "SELECT * FROM Petition ORDER BY "
};