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
            throw("Not Found");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

function getISODate(date){
    let isoDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() ;
    return isoDate;
}

async function checkPostRequest(user_id, title, description, category_id,created_date, closing_date) {
    if(title === undefined || title.length === 0) throw('Bad Request');
    if(description === undefined || description.length === 0) throw('Bad Request');
    if(!(await Petition.checkCategory(category_id))) throw('Bad Request');
    if(closing_date < created_date) throw('Bad Request');
};

exports.addPetition = async function (req, res) {
    try{
        const title = req.body.title;
        const description = req.body.description;
        const category_id = req.body.categoryId;
        const closing_date = getISODate(new Date(req.body.closingDate));
        let created_date = getISODate(new Date());
        const req_auth_token = req.header('X-Authorization');
        if (req_auth_token === undefined) throw('Unauthorized');
        const user_id = await Auth.getUserFromAuth(req_auth_token);
        await checkPostRequest(user_id, title, description, category_id, created_date, closing_date);
        const result = await Petition.addPetition(title, description, user_id, category_id, created_date, closing_date);
        res.status(201)
            .send({"petitionId":result.insertId});
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};