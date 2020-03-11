const db = require('../../config/db');

exports.checkEmail = async function (email) {
    let approveEmail = false;
    const connection = await db.getPool();
    const q = "select count(*) as count from User where email = (?)";
    const [result, _] = await connection.query(q, email);
    if(result[0].count === 0) {
        approveEmail = true;
    }
    return approveEmail;
};

exports.insert = async function (name, email, password, city, country) {
    const values = [name, email, password, city, country];
    const connection = await db.getPool();
    const q = "insert into User (name, email, password, city, country) values (?)";
    const [result, _] = await connection.query(q, [values]);
    return result;
};

exports.getPass = async function (email) {
    const connection = await db.getPool();
    let q = "select user_id, password from User where email = (?)";
    const [result, _] = await connection.query(q, email);
    return result;
}

exports.setAuth = async function (email, token) {
    const connection = await db.getPool();
    const values = [token, email];
    const q = "UPDATE User SET auth_token = (?) where email = (?)";
    const [result, _] = await connection.query(q, values);
};

exports.checkAuthUserId = async function (user_id) {
    const connection = await db.getPool();
    const q = "SELECT auth_token from User where user_id = (?)";
    const [result,_] = await connection.query(q, user_id);
    return result;
};

exports.removeAuth = async function (auth_token) {
    const connection = await  db.getPool();
    const q = "UPDATE User SET auth_token = NULL where auth_token = (?)";
    const [result, _] = await connection.query(q, auth_token);
    return result;
};

exports.getUser = async function (user_id) {
    const connection = await db.getPool()
    const q = "SELECT name, city, country, email from User where user_id = (?)";
    const [result,_] = await connection.query(q, user_id);
    return result;
};

exports.updateUser = async function (name, email, password, city, country, user_id) {
    const values = [name, email, password, city, country, user_id];
    console.log(values);
    const connection = await db.getPool();
    const q = "UPDATE User SET name = (?), email = (?), password = (?), city = (?), country = (?) where user_id = (?)";
    const [result, _] = await connection.query(q, values);
    return result;
};