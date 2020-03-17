exports.errorOccurred = function (err, res) {
    switch (err) {
        case "Bad Request":
            res.status(400)
                .send(err);
            break;
        case "Unauthorized":
            res.status(401)
                .send(err);
            break;
        case "Forbidden":
            res.status(403)
                .send(err);
            break;
        case "Not Found":
            res.status(404)
                .send(err);
            break;
        default:
            res.status(500)
                .send(`Internal Server Error: ${err}`);
            break;
    }
}