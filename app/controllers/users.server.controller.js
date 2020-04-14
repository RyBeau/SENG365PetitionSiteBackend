const User = require('../models/users.server.model');
const Auth = require("../middleware/userAuth.middleware");
const Error = require("../middleware/error.middleware");
const Password = require("../middleware/password.middleware");
const fs = require('fs');
const cryptoRandomString = require("crypto-random-string");

async function checkEmail(email){
    let result = false;
    if (email.includes("@") && await User.checkEmail(email)){
        result = true;
    }
    return result;
}

exports.register = async function (req, res) {
    try {
        const name = req.body.name;
        const email = req.body.email;
        let password = req.body.password;
        if (password != null && await checkEmail(email) && name != null) {
            password = await Password.hash(password);
            const result = await User.insert(name, email, password, req.body.city, req.body.country);
            res.status(201)
                .send({"userId":result.insertId});
        } else {
            throw("Bad Request");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
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
            if(await Password.validate(password, dbPassword)){
                let token = cryptoRandomString({length: 20, type: "base64"});
                await User.setAuth(email, token);
                res.status(200)
                    .send({"userId": user_id, "token":token});
        } else {
                throw("Bad Request");
            }
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.logout = async function (req, res) {
    try {
        const auth_token = req.header('X-Authorization');
        if (auth_token === undefined){
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
        Error.errorOccurred(err, res);
    }
};

exports.viewUser = async function (req, res) {
    try {
        const user_id = req.params.user_id;
        const req_auth_token = req.header('X-Authorization');
        const result = await User.getUser(user_id);
        if (result.length === 0){
            throw("Not Found");
        } else {
            let responseBody = result[0];
            if (req_auth_token != undefined){
                if (!(await Auth.authenticate(req_auth_token, user_id))) {
                    delete responseBody.email;
                }
            } else {
                delete responseBody.email;
            }
            res.status(200)
                .send(responseBody);
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

async function checkPassword(req, email, password, currentPassword, dbPassword, originalUser){
    if (email != undefined){
        if (!(await checkEmail(email)) && email !== originalUser.email){
            throw("Bad Request");
        }
    } else if (req.hasOwnProperty('email')){
        throw("Bad Request");
    } else {
        email = originalUser.email;
    }
    if (password != undefined) {
        const result = await Password.validate(currentPassword, dbPassword);
        if (!result){
            throw("Forbidden");
        }
    } else if (req.hasOwnProperty('password')) {
        throw("Bad Request");

    } else {
        password = dbPassword;
    }
    return [password, email];
}

exports.updateUser = async function (req, res) {
    try {
        const user_id = req.params.user_id;
        const auth_token = req.header("X-Authorization");
        if(Object.getOwnPropertyNames(req.body).length === 0) throw("Bad Request");
        if (auth_token != undefined && await Auth.authenticate(auth_token, user_id)) {
            const originalUser = (await User.getUser(user_id))[0];
            const dbPassword = (await User.getPass(originalUser.email))[0].password;
            const name = req.body.name === undefined ? originalUser.name: req.body.name;
            const city = req.body.city === undefined ? originalUser.city: req.body.city;
            const country = req.body.country === undefined ? originalUser.country: req.body.country;
            let email = req.body.email;
            let password = await Password.hash(req.body.password);
            let currentPassword = req.body.currentPassword;
            [password, email] = await checkPassword(req, email, password, currentPassword, dbPassword, originalUser);
            await User.updateUser(name, email, password, city, country, user_id);
            res.status(200)
                .send("OK");
        } else {
            throw("Unauthorized")
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.viewPhoto = async function (req, res) {
    try {
        const user_id = req.params.user_id;
        let filename = await User.getPhoto(user_id);
        if(filename.length > 0) {filename = filename[0].photo_filename}
        else {throw("Not Found")}
        if(filename != null){
            res.status(200)
                .sendFile("/storage/photos/"  + filename, {root: process.cwd()});
        } else {
            throw("Not Found");
        }
    } catch (err){
        Error.errorOccurred(err, res);
    }
};

function getContentType (typeHeader){
    switch (typeHeader){
        case "image/png":
            return ".png";
        case "image/jpeg":
            return ".jpeg";
        case "image/gif":
            return ".gif";
        default:
            throw("Bad Request");
    }
}

async function photoChecks (req) {
    const user_id = req.params.user_id;
    if (!(await Auth.userExists(user_id))) throw("Not Found");
    const req_auth_token = req.header("X-Authorization");
    if (req_auth_token === undefined) throw("Unauthorized");
    if(!(await Auth.authenticate(req_auth_token, user_id))) throw("Forbidden");
    return user_id;
}

exports.addPhoto =  async function (req, res) {
    try{
        const user_id = await photoChecks(req);
        const path = process.cwd() + "/storage/photos/"
        const contentType = getContentType(req.header("Content-Type"));
        const photo = req.body;
        const newFilename = "user_" + user_id + contentType;
        const oldFilename = (await User.getPhoto(user_id))[0].photo_filename;
        if (photo.length === 0) throw("Bad Request");
        if (oldFilename != null){
            await fs.unlink(path + oldFilename, (err) =>{if (err) throw(err);});
            await fs.writeFile(path + newFilename, photo, "binary",(err) => {if(err) throw(err);});
            await User.setPhoto(user_id, newFilename);
            res.status(200)
                .send("OK");
        } else {
            await fs.writeFile(path + newFilename, photo, "binary",(err) =>{if (err) throw(err);});
            await User.setPhoto(user_id, newFilename);
            res.status(201)
                .send("Created");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.deletePhoto = async function (req, res) {
    try {
        const user_id  = await photoChecks(req);
        const path = process.cwd() + "/storage/photos/"
        const filename = (await User.getPhoto(user_id))[0].photo_filename;
        if (filename != null){
            await fs.unlink(path + filename, (err) =>{if (err) throw(err);});
            res.status(200)
                .send("OK");
        } else {
            throw("Not Found");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};