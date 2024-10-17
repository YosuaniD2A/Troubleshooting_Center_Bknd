const db = require("../config/dbConfig").promise();


const saveUrlsModel = (mockup, url) => {
    return db.query(`
        INSERT INTO ptos_urls (mockup, url) 
        VALUES (?,?)`,
        [mockup, url])
}

module.exports = {
    saveUrlsModel
}