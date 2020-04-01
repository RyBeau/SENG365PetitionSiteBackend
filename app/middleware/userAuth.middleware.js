const User = require("../models/users.server.model");

exports.authenticate = async function (authHeader, userId) {
    let authorised = false;
    const user_auth = (await User.checkAuthUserId(userId))[0].auth_token;
    if (user_auth === authHeader){
        authorised = true;
    }
    return authorised
};

exports.userExists = async function (user_id) {
    let exists = false;
    const userCount = (await User.countUser(user_id));
    if (userCount[0].userCount > 0){
        exists = true;
    }
    return exists;
};

exports.getUserFromAuth = async function (auth_token) {
    try {
        const user_id = (await User.getUserFromAuth(auth_token))[0].user_id;
        return user_id;
    } catch (err) {
        throw('Unauthorized');
    }
};