const db = require('../../config/db');

exports.checkEmail = async function (email) {
    let approveEmail = false;
    const connection = await db.getPool().getConnection();
    const q = "select count(*) as count from User where email = (?)";
    const [result, _] = await connection.query(q, email);
    if(result[0].count === 0) {
        approveEmail = true;
    }
    return approveEmail;
};

exports.insert = async function (name, email, password, city, country) {
    const values = [name, email, password, city, country];
    const connection = await db.getPool().getConnection();
    const q = "insert into User (name, email, password, city, country) values (?)";
    const [result, _] = await connection.query(q, [values]);
    return result;
};