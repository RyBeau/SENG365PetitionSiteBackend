const User = require('../models/users.server.model');

async function checkEmail(email){
    let result = false;
    if (email.contains("@") && await User.checkEmail(email)){
        result = true;
    }
    return result;
}

exports.register = async function (req, res) {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        if (password === null || await checkEmail(email)) {
            User.insert(name, email, password, req.body.city, req.body.country);
        } else {
            throw("Bad Request");
        }
    } catch (err) {
        switch (err){
            case "Bad Request":
                res.status(400)
                    .send(err);
                break;
            default:
                res.status(500)
                    .send("Internal Server Error");
                break;
        }
    }
};