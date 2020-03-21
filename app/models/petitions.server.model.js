const db = require('../../config/db');

exports.petitionExists = async function (petition_id) {
    const connection = await db.getPool();
    const q = "SELECT count(*) AS count FROM Petition WHERE petition_id = (?)";
    const [result, _] = await connection.query(q, petition_id);
    if(result[0].count > 0){
        return true;
    } else {
        return false;
    }
};

exports.getPetitions = async function (startIndex) {
    const connection = await db.getPool();
    const q = "SELECT Petition.petition_id AS petitionId, title, Category.name AS category, User.name, count(signatory_id) AS signatureCount, Petition.category_id, author_id  FROM (((Petition JOIN User ON user_id = author_id)" +
        " JOIN Category on Petition.category_id = Category.category_id)LEFT OUTER JOIN Signature ON Petition.petition_id = Signature.petition_id) WHERE Petition.petition_id >= (?) GROUP BY Petition.petition_id ORDER BY signatureCount DESC;";
    const [result, _] = await connection.query(q, startIndex + 1);
    return result;
};

exports.getPetitionFromID = async function (petitionID) {
    const connection = await db.getPool();
    const q = "SELECT Petition.petition_id as petitionID, title, Category.name AS category, User.name AS authorName, count(Signature.signatory_id) AS signatureCount" +
        ",description, author_id AS authorId, city AS authorCity, country AS authorCountry, created_date AS createdDate, closing_date AS closingDate" +
        " FROM (((Petition JOIN Category ON Petition.category_id = Category.category_id) JOIN User ON author_id = user_id) LEFT OUTER JOIN" +
        " Signature ON Signature.petition_id = Petition.petition_id) WHERE Petition.petition_id = (?) group by Petition.petition_id";
    const [result, _] = await connection.query(q, petitionID);
    return result;
};

exports.checkCategory = async function (category_id){
    const connection = await db.getPool();
    const q = "SELECT count(*) AS isValid FROM Category WHERE category_id = (?)";
    const [result, _] = await connection.query(q, category_id);
    if(result[0].isValid > 0){
        return true;
    } else {
        return false;
    }
};

exports.addPetition = async function (title, description, author_id, category_id, created_date, closing_date){
    const values = [title, description, author_id, category_id, created_date, closing_date];
    const connection = await db.getPool();
    const q = "INSERT INTO Petition (title, description, author_id, category_id, created_date, closing_date) VALUES (?)";
    const [result, _] = await connection.query(q, [values]);
    return result;
};

exports.getAuthorID = async function (petition_id){
    const connection = db.getPool();
    const q = "SELECT author_id from Petition WHERE petition_id = (?)";
    const [result, _] = await connection.query(q, petition_id);
    return result;
};

exports.deletePetition = async function (petition_id){
    const connection = db.getPool();
    const q = "DELETE FROM Petition WHERE petition_id = (?)";
    await connection.query(q, petition_id);
};

exports.viewCategories = async function () {
    const connection = await db.getPool();
    const q = "SELECT category_id AS categoryId, name FROM Category";
    const [result, _] = await connection.query(q);
    return result;
};

exports.updatePetition = async function (petition_id, title, description, category_id, closing_date) {
    const connection = await db.getPool();
    const values = [title, description, category_id, closing_date, petition_id];
    const q = "UPDATE Petition SET title = (?), description = (?), category_id = (?), closing_date = (?) WHERE petition_id = (?)";
    await connection.query(q, values);
};

exports.getPetitionCategoryID = async function (petition_id) {
    const connection = await db.getPool();
    const q = "SELECT category_id FROM Petition WHERE petition_id = (?)";
    const [result, _] = await connection.query(q, petition_id);
    return result;
};

exports.getPhoto = async function (petition_id) {
    const connection = await db.getPool();
    const q = "SELECT photo_filename FROM Petition WHERE petition_id = (?)";
    const [result, _] = await connection.query(q, petition_id);
    return result;
};

exports.setPhoto = async function (petition_id, photo_filename) {
    const values = [photo_filename, petition_id];
    const connection = await db.getPool();
    const q = "UPDATE Petition SET photo_filename = (?) WHERE petition_id = (?)";
    await connection.query(q, values);
};

exports.getSignatures = async function (petition_id) {
    const connection = await db.getPool();
    const q = "SELECT signatory_id AS signatoryId, name, city, country, signed_date AS signedDate FROM Signature JOIN " +
        "User ON signatory_id = user_id WHERE petition_id = (?) ORDER BY signed_date";
    const [result, _] = await connection.query(q, petition_id);
    return result;
};

exports.petitionClosed = async function(petition_id){
    const connection = await db.getPool();
    const q = "SELECT closing_date FROM Petition WHERE petition_id = (?)";
    const [result, _] = await connection.query(q, petition_id);
    if((Date(result[0].closing_date)) > (new Date())){
        return true;
    } else {
        return false;
    }
};

exports.hasSigned = async function (user_id, petition_id){
    const values = [petition_id, user_id];
    const connection = await db.getPool();
    const q = "SELECT count(*) AS count FROM Signature WHERE petition_id = (?) AND signatory_id = (?)";
    const [result, _] = await connection.query(q, values);
    if(result[0].count > 0){
        return true;
    } else {
        return false;
    }
};

exports.signPetition = async function (petition_id, user_id, signed_date){
    const values = [petition_id, user_id, signed_date];
    const connection = await db.getPool();
    const q = "INSERT INTO Signature (petition_id, signatory_id, signed_date) VALUES (?)";
    await connection.query(q, [values]);
};

exports.removeSignature = async function (petition_id, user_id) {
    const values = [petition_id, user_id];
    const connection = await db.getPool();
    const q = "DELETE FROM Signature WHERE petition_id = (?) AND signatory_id = (?)";
    await connection.query(q, values);
};