const User = require("../models/users.server.model");

exports.authenticate = async function (authHeader, userId) {
    let authorised = false;
    const user_auth = (await User.checkAuthUserId(userId))[0].auth_token;
    if (user_auth === authHeader){
        authorised = true;
    }
    return authorised
};