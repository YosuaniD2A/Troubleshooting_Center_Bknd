const db = require("../config/dbConfig").promise();

const getIncomingOrdersModel = () => {
    return db.query(`SELECT *  FROM pod2_orders WHERE podService COLLATE utf8mb4_unicode_ci IN('swiftpod')`);
}

const getArt = (art) => {
    return db.query('SELECT * FROM art_url_clone WHERE art = ?',[art])
}

const saveArtModel = (art) => {
    return db.query(
        `INSERT INTO art_url_clone 
            (art, url, pod, type) 
        VALUES 
            (?,?,?,?)`,
        [
            art.art,
            art.url,
            art.pod,
            art.type
        ]);
}

const getMock = (sku) => {
    return db.query('SELECT * FROM mockup_url_clone WHERE sku = ?',[sku])
}

const saveMockupModel = (mockup) => {
    return db.query(
        `INSERT INTO mockup_url_clone 
            (sku, url, type) 
        VALUES 
            (?,?,?)`,
        [
            mockup.sku,
            mockup.url,
            mockup.type
        ]);
}

module.exports = {
    getIncomingOrdersModel,
    getArt,
    getMock,
    saveArtModel,
    saveMockupModel
}