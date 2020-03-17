const db = require('../../config/db');

exports.getPetitions = async function () {
    const connection = db.getPool();
    const q = "SELECT * FROM Petition ORDER BY "
};

exports.getPetitionFromID = async function (petitionID) {
    const connection = await db.getPool();
    const q = "SELECT Petition.petition_id as petitionID, title, Category.name AS category, User.name AS authorName, count(Signature.signatory_id) AS signatureCount" +
        ",description, author_id AS authorId, city AS authorCity, country AS authorCountry, created_date AS createdDate, closing_date AS closingDATE" +
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