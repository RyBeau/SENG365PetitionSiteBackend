const User = require('../models/users.server.model');

async function checkEmail(email){
    let result = false;
    if (email.includes("@") && await User.checkEmail(email)){
        result = true;
    }
    return result;
}

function errorOccured (err, res) {
    switch (err) {
        case "Bad Request":
            res.status(400)
                .send(`${err}`);
            break;
        case "Unauthorized":
            res.status(401)
                .send(`${err}`);
            break;
        default:
            res.status(500)
                .send(`Internal Server Error: ${err}`);
            break;
    }
}

exports.register = async function (req, res) {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        if (password != null && await checkEmail(email) && name != null) {
            const result = await User.insert(name, email, password, req.body.city, req.body.country);
            res.status(201)
                .send({"userId":result.insertId});
        } else {
            throw("Bad Request");
        }
    } catch (err) {
        errorOccured(err, res);
    }
};

exports.login = async function (req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;
        if (await User.checkEmail(email) || password === null) {throw("Bad Request")}
        else {
            let queryResult = await User.getPass(email);
            const dbPassword = queryResult[0].password;
            const user_id = queryResult[0].user_id;
            if(password === dbPassword){
                let token = Math.random(32).toString().substring(7);
                await User.setAuth(email, token);
                res.status(200)
                    .send({"userId": user_id, "token":token});
        } else {
                throw("Bad Request");
            }
        }
    } catch (err) {
        errorOccured(err, res);
    }
};

exports.logout = async function (req, res) {
    try {
        const auth_token = req.header('X-Authorization');
        if (auth_token === null){
            throw("Unauthorized");
        } else {
            const result = await User.removeAuth(auth_token);
            if (result.affectedRows === 0){
                throw("Unauthorized");
            } else {
                res.status(200)
                    .send("OK");
            }
        }
    } catch (err) {
        errorOccured(err, res);
    }
};