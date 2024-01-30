const db = require("../config/dbConfig").promise();

const getImage = (design) => {
    return db.query('SELECT * FROM art_url ar WHERE  ar.art like ?',[design+'%'])
}

const changeImage = (url, id) => {
    return db.query('UPDATE art_url ar SET ar.url = ? WHERE id = ?', [url, id])
}

module.exports = {
    getImage,
    changeImage
}