const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

exports.hash = async function (plainPassword) {
    const result = bcrypt.hash(plainPassword, SALT_ROUNDS)
        .then((hash) => {
            return hash;
        })
    return result;
};

exports.validate = async function (plainPassword, hashedPassword) {
    const result = bcrypt.compare(plainPassword, hashedPassword)
        .then(res => {
            return res;
        })
    return result;
};