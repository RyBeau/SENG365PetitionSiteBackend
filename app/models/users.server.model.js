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

exports.getPass = async function (email) {
    const connection = await db.getPool().getConnection();
    let q = "select user_id, password from User where email = (?)";
    const [result, _] = await connection.query(q, email);
    return result;
}

exports.setAuth = async function (email, token) {
    const connection = await db.getPool().getConnection();
    const values = [token, email];
    const q = "UPDATE User SET auth_token = (?) where email = (?)";
    const [result, _] = await connection.query(q, values);
};