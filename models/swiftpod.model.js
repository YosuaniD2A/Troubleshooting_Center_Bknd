const db = require("../config/dbConfig").promise();
const dbRail = require("../config/railwayDbConfig").promise();

const getIncomingOrdersModel = () => {
    return db.query(`
    SELECT * FROM pod2_orders WHERE podService COLLATE utf8mb4_unicode_ci IN('swiftpod')`);
}
// const getIncomingOrdersModel = () => {
//     return db.query(`
//     SELECT * FROM pod_orders`);
// }

const getArtFront = (art) => {
    return db.query(`SELECT * FROM art_url WHERE art = ? AND type = 'front'`,[art])
}

const saveArtFrontModel = (art) => {
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
    return db.query('SELECT * FROM mockup_url WHERE sku = ?',[sku])
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

const getShipping = (site_order_id) => {
    return db.query('SELECT * FROM shipping_labels WHERE site_order_id = ?',[site_order_id])
}

const saveShippingLabelModel = (shippingLabel) => {
    return db.query(
        `INSERT INTO shipping_labels 
            (site_order_id, guide_number, carrier, url, tracking_url) 
        VALUES 
            (?,?,?,?,?)`,
        [
            shippingLabel.site_order_id,
            shippingLabel.tracking_code,
            shippingLabel.carrier,
            shippingLabel.url,
            shippingLabel.tracking_url
        ]);
}

const getArtInnerNeck = (art) => {
    return db.query(`SELECT * FROM art_url WHERE art = ? AND type = 'inner_neck'`,[art])
}

const getArtOuterNeck = (art) => {
    return db.query(`SELECT * FROM art_url WHERE art = ? AND type = 'outer_neck'`,[art])
}

const deleteArtNeckModel = (art) => {
    return db.query(`DELETE FROM art_url WHERE art = ? AND type = 'inner_neck'`,[art])
}

const saveArtNeckModel = (art) => {
    return db.query(
        `INSERT INTO art_url 
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

//---------------------------------------------------

const saveSwiftPODOrderModal = (swiftPODOrder) => {
    return db.query(
        `INSERT INTO swiftpod_orders 
            (site_order_id, order_id, swift_id, site_name, date, status) 
        VALUES 
            (?,?,?,?,?,?)`,
        [
            swiftPODOrder.site_order_id,
            swiftPODOrder.order_id,
            swiftPODOrder.swift_id,
            swiftPODOrder.site_name,
            swiftPODOrder.date,
            swiftPODOrder.status
        ]);
}

const getSwiftPODOrderModel = () => {
    return db.query(`
        SELECT 
            * 
        FROM 
            swiftpod_orders sfp 
        WHERE 
            sfp.status != 'cancelled' AND 
            (sfp.tracking_code IS NULL OR sfp.tracking_code = '')  
        ORDER BY 
            sfp.date 
        DESC;`)
}

const getSwiftPODOrdersStatusModel = (order_id) => {
    return dbRail.query(`
        SELECT 
            * 
        FROM 
            sfp_orders_webhooks sfph
        WHERE 
            sfph.order_id = ? 
        `,[order_id])
}

const updateSwiftPODOrderStatusModel = (order_id, data) => {
    const fieldsToUpdate = Object.keys(data).map(key => `${key} = ?`).join(', ');

    return db.query(`UPDATE swiftpod_orders SET ${fieldsToUpdate} WHERE order_id = ?`,
        [...Object.values(data), order_id]);
}


module.exports = {
    getIncomingOrdersModel,
    getArtFront,
    getMock,
    getArtInnerNeck,
    getArtOuterNeck,
    getShipping,
    saveArtFrontModel,
    saveMockupModel,
    saveArtNeckModel,
    saveShippingLabelModel,
    deleteArtNeckModel,
    saveSwiftPODOrderModal,
    getSwiftPODOrderModel,
    getSwiftPODOrdersStatusModel,
    updateSwiftPODOrderStatusModel
}