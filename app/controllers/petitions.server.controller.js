const Petition = require('../models/petitions.server.model');
const Error = require('../middleware/error.middleware');
const Auth = require('../middleware/userAuth.middleware');
const User = require('../models/users.server.model');
const fs = require('fs');

const _SORTS = ["ALPHABETICAL_ASC","ALPHABETICAL_DESC","SIGNATURES_ASC","SIGNATURES_DESC"];

async function getParameters (req) {
    const count = req.query.count === undefined ? undefined : Number(req.query.count);
    if(req.query.hasOwnProperty("count") && (count === undefined)) throw ("Bad Request");
    let q = req.query.q === undefined ? undefined : req.query.q;
    if(req.query.hasOwnProperty("q") && (q === undefined || q.length === 0)){
        throw ("Bad Request");
    } else if(q != undefined) {
        q = q.toLowerCase();
    }
    const categoryId = req.query.categoryId === undefined ? undefined : Number(req.query.categoryId);
    if(req.query.hasOwnProperty("categoryId") && (categoryId === undefined)) {throw ("Bad Request")}
    if((categoryId !== undefined) &&!(await Petition.checkCategory(categoryId))) throw("Bad Request");
    const authorId = req.query.authorId === undefined ? undefined : Number(req.query.authorId);
    if(req.query.hasOwnProperty("authorId") && (authorId === undefined)) throw ("Bad Request");
    if((authorId !== undefined) && (await User.countUser(req.query.authorId))[0].count === 0) throw("Bad Request");
    const sortBy = req.query.sortBy === undefined ? undefined : req.query.sortBy;
    if(req.query.hasOwnProperty("sortBy") && (sortBy === undefined || sortBy.length === 0)) throw ("Bad Request");
    if(!_SORTS.includes(sortBy) && sortBy !== undefined) throw("Bad Request");
    return {"categoryId":categoryId, "authorId":authorId, "count":count, "q":q,"sortBy":sortBy};
}

function alphabeticalSort(a, b){
        let titleA = a.title.toUpperCase();
        let titleB = b.title.toUpperCase();
        if(titleA < titleB){
            return -1
        } else if (titleB < titleA){
            return 1
        } else{
            return 0;
        }
}

function sortPetition(petitions, sortBy){
    switch (sortBy) {
        case _SORTS[0]:
            petitions = petitions.sort(alphabeticalSort);
            return petitions;
        case _SORTS[1]:
            petitions = petitions.sort(alphabeticalSort).reverse();
            return petitions;
        case _SORTS[3]:
            petitions = petitions.sort(function(a, b){
                return a.signatureCount - b.signatureCount;
            });
            return petitions;
        default:
            return petitions;
    }
}

async function processPetitions (petitions, req) {
    const parameters = await getParameters(req);
    for (let i = petitions.length - 1; i > -1; i--) {
        if (petitions[i].author_id != parameters.authorId && parameters.authorId != undefined) {
            petitions.splice(i, 1);
        }
        else if (petitions[i].category_id != parameters.categoryId && parameters.categoryId != undefined) {
            petitions.splice(i, 1);
        }
        else if (!petitions[i].title.toLowerCase().includes(parameters.q) && parameters.q != undefined) {
            petitions.splice(i, 1);
        } else {
            delete petitions[i].author_id;
            delete petitions[i].category_id;
        }
    }
    petitions = sortPetition(petitions, parameters.sortBy);
    if(parameters.count != undefined) petitions = petitions.slice(0, parameters.count);
    return petitions;
}

exports.viewAll = async function (req, res) {
    try{
        const startIndex = req.query.startIndex === undefined ? 0 : Number(req.query.startIndex);
        let petitions = await Petition.getPetitions(startIndex);
        if(Object.keys(req.query).length >= 1 && startIndex != undefined){
            petitions = await processPetitions(petitions, req);
        } else {
            for (let i = petitions.length - 1; i > -1; i--) {
                delete petitions[i].author_id;
                delete petitions[i].category_id;
            }
        }
        res.status(200)
            .send(petitions);
    } catch (err){
        Error.errorOccurred(err, res);
    }
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

exports.deletePetition = async function (req, res) {
    try {
        const petition_id = req.params.petition_id;
        if((await Petition.getPetitionFromID(petition_id))[0].length === 0) throw("Not Found");
        const req_auth_token = req.header("X-Authorization");
        if (req_auth_token === undefined) throw('Unauthorized');
        const author_id = (await Petition.getAuthorID(petition_id))[0].author_id;
        if(!(await Auth.authenticate(req_auth_token, author_id))) throw("Forbidden");
        await Petition.deletePetition(petition_id);
        res.status(200)
            .send("OK");
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.updatePetition = async function (req, res) {
    try {
        const petition_id = req.params.petition_id;
        const req_auth_token = req.header("X-Authorization");
        if (req_auth_token === undefined) throw("Unauthorized");
        const petition_information = (await Petition.getPetitionFromID(petition_id))[0];
        if(petition_information === undefined) throw("Not Found");
        if(!(await Auth.authenticate(req_auth_token, petition_information.authorId))) throw("Forbidden");
        let title = petition_information.title;
        if (req.body.hasOwnProperty("title")){
            if(req.body.title === undefined || req.body.title.length < 1) throw("Bad Request");
             title = req.body.title;
        }
        let description = petition_information.description;
        if (req.body.hasOwnProperty("description")) {
            if (req.body.description === undefined || req.body.description.length < 1) throw("Bad Request");
            description = req.body.description;
        }
        let category_id = (await Petition.getPetitionCategoryID(petition_id))[0].category_id;
        if (req.body.hasOwnProperty("categoryId")){
            if(!(await Petition.checkCategory(req.body.categoryId))) throw("Bad Request");
                category_id = req.body.categoryId;
        }
        let closing_date = petition_information.closingDate;
        const current_date = new Date();
        const req_closing_date = new Date(req.body.closingDate);
        if (req.body.hasOwnProperty("closingDate")){
            if(req_closing_date === undefined|| req_closing_date < current_date) throw("Bad Request");
            closing_date = getISODate(req_closing_date);
        }
        await Petition.updatePetition(petition_id, title, description, category_id, closing_date);
        res.status(200)
            .send("OK");
    } catch (err){
        Error.errorOccurred(err, res);
    }
};

exports.getCategories = async function (req, res) {
    try {
        const categories = (await Petition.viewCategories());
        res.status(200)
            .send(categories);
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.viewPhoto = async function (req, res) {
    try {
        const petition_id = req.params.petition_id;
        let filename = await Petition.getPhoto(petition_id);
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
    const petition_id = req.params.petition_id;
    if(!(await Petition.petitionExists(petition_id))) throw("Not Found");
    let author_id = (await Petition.getAuthorID(petition_id))[0].author_id;
    const req_auth_token = req.header("X-Authorization");
    if (req_auth_token === undefined) throw("Unauthorized");
    if(!(await Auth.authenticate(req_auth_token, author_id))) throw("Forbidden");
    return petition_id;
}

exports.addPhoto =  async function (req, res) {
    try{
        const petition_id = await photoChecks(req);
        const path = process.cwd() + "/storage/photos/"
        const contentType = getContentType(req.header("Content-Type"));
        const photo = req.body;
        const newFilename = "petition" + petition_id + contentType;
        const oldFilename = (await Petition.getPhoto(petition_id))[0].photo_filename;
        if (photo.length === 0) throw("Bad Request");
        if (oldFilename != null){
            await fs.unlink(path + oldFilename, (err) =>{if (err) throw(err);});
            await fs.writeFile(path + newFilename, photo, "binary",(err) => {if(err) throw(err);});
            await Petition.setPhoto(petition_id, newFilename);
            res.status(200)
                .send("OK");
        } else {
            await fs.writeFile(path + newFilename, photo, "binary",(err) =>{if (err) throw(err);});
            await Petition.setPhoto(petition_id, newFilename);
            res.status(201)
                .send("Created");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.getSignatures = async function (req, res) {
    try {
        const petition_id = req.params.petition_id;
        if(await Petition.petitionExists(petition_id)) {
            const result = (await Petition.getSignatures(petition_id));
            res.status(200)
                .send(result);
        } else {
            throw("Not Found");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.addSignature = async function (req, res) {
    try{
        const petition_id = req.params.petition_id;
        const req_auth_token = req.header("X-Authorization");
        const signed_date = getISODate(new Date());
        if (req_auth_token === undefined) throw("Unauthorized");
        if(!(await Petition.petitionExists(petition_id))) throw("Not Found");
        let user_id = await User.getUserFromAuth(req_auth_token);
        if(user_id.length === 0) throw("Forbidden");
        user_id = user_id[0].user_id;
        if(await Petition.petitionClosed(petition_id) || await Petition.hasSigned(user_id, petition_id)) throw("Forbidden");
        await Petition.signPetition(petition_id, user_id, signed_date);
        res.status(201)
            .send("OK");
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};

exports.removeSignature = async function (req, res) {
    try{
        const petition_id = req.params.petition_id;
        const req_auth_token = req.header("X-Authorization");
        if (req_auth_token === undefined) throw("Unauthorized");
        if(!(await Petition.petitionExists(petition_id))) throw("Not Found");
        let user_id = await User.getUserFromAuth(req_auth_token);
        if(user_id.length === 0) throw("Forbidden");
        user_id = user_id[0].user_id;
        if(await Petition.petitionClosed(petition_id) ||
            !(await Petition.hasSigned(user_id, petition_id)) ||
            (await Petition.getAuthorID(petition_id))[0].author_id === user_id){
            throw("Forbidden");
        } else {
            await Petition.removeSignature(petition_id, user_id);
            res.status(200)
                .send("OK");
        }
    } catch (err) {
        Error.errorOccurred(err, res);
    }
};