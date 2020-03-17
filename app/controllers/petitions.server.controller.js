const Petition = require('../models/petitions.server.model');
const Error = require('../middleware/error.middleware');
const Auth = require('../middleware/userAuth.middleware');

exports.viewAll = async function (req, res) {

};

exports.viewOne = async function (req, res) {
    try{
        const petition_id = req.params.petition_id;
        const result = await Petition.getPetitionFromID(petition_id);
        if (result.length > 0){
            res.status(200).send(result[0]);
        } else {
            throw("Not Found")
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

function getISODate(){

}

async function checkPostRequest(user_id, title, description, category_id,created_date, closing_date) {
    if(user_id === undefined) throw('Unauthorized');
    if(title === undefined) throw('Bad Request');
    if(description === undefined) throw('Bad Request');
    if(!(await Petition.checkCategory(category_id))) throw('Bad Request');
    if(closing_date < created_date) throw('Bad Request');
};

exports.addPetition = async function (req, res) {
    try{
        const title = req.body.title;
        const description = req.body.description;
        const category_id = req.body.categoryId;
        const closing_date = Date(req.body.closingDate);
        let created_date = getDate();
        const req_auth_token = req.header('X-Authorization');
        if (req_auth_token === undefined) throw('Unauthorized');
        const user_id = (await Auth.getUserFromAuth(req_auth_token))[0].user_id;
        checkPostRequest(user_id, title, description, category_id, created_date, closing_date);
        const result = await Petition.addPetition(title, description, user_id, category_id, created_date, closing_date);
        res.status(201)
            .send({"petitionId":result.insertId});
    } catch (err) {
        console.log(err);
        Error.errorOccurred(err, res);
    }
};