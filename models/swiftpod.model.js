const db = require("../config/dbConfig").promise();
const dbRail = require("../config/railwayDbConfig").promise();

// const getIncomingOrdersModel = () => {
//     return db.query(`
//     SELECT * FROM pod2_orders WHERE podService COLLATE utf8mb4_unicode_ci IN('swiftpod')`);
// }
const getIncomingOrdersModel = () => {
    return db.query(`
    SELECT * FROM pod2_orders`);
}

const getSwiftpodBrandModel = (design) => {
    return db.query(`
        SELECT 
            CASE 
                WHEN b.license IS NULL THEN 'unknown' 
                ELSE b.license 
            END AS brand_name
        FROM 
            swiftpod_metadata m
        LEFT JOIN 
            swiftpod_brands b
            ON SUBSTRING(m.swiftpod_id, 1, 2) = b.signal -- Relaciona con el brand usando los primeros 2 caracteres
        WHERE 
            LPAD(m.id, 8, '0') = ?`,[design])
}

const getArt = (art, type, pod) => {
    return db.query(`SELECT * FROM art_url WHERE art = ? AND type = ? AND pod = ?`,[art, type, pod])
}

const saveArtFrontModel = (art) => {
    return db.query(
        `INSERT INTO art_url 
            (art, url, pod, type) 
        VALUES 
            (?,?,?,?)
        ON DUPLICATE KEY UPDATE 
            url = VALUES(url), 
            pod = VALUES(pod), 
            type = VALUES(type)`,
        [
            art.art,
            art.url,
            art.pod,
            art.type
        ]);
}

const saveArtFrontModel_Clone = (art) => {
    return db.query(
        `INSERT INTO art_url_clone 
            (art, url, pod, type) 
        VALUES 
            (?,?,?,?)
        ON DUPLICATE KEY UPDATE 
            url = VALUES(url), 
            pod = VALUES(pod), 
            type = VALUES(type)`,
        [
            art.art,
            art.url,
            art.pod,
            art.type
        ]);
}

const getMock = (sku, type, region) => {
    return db.query(`SELECT * FROM mockup_url WHERE sku = ? AND type = ? AND region = ?`,[sku, type, region])
}

const getSimilarMock = (skuBase) => {
    return db.query(`SELECT * FROM mockup_url WHERE sku LIKE ? ORDER BY id DESC LIMIT 1`,[`${skuBase}%`])
}

const getSimilarArt = (design) => {
    return db.query(`SELECT * FROM art_url WHERE art LIKE ? ORDER BY id DESC LIMIT 1`,[`${design}%`])
}

const saveMockupModel = (mockup) => {
    return db.query(
        `INSERT INTO mockup_url 
            (sku, url, region, type) 
        VALUES 
            (?,?,?,?)
        ON DUPLICATE KEY UPDATE 
            sku = VALUES(sku),
            url = VALUES(url), 
            region = VALUES(region), 
            type = VALUES(type)`,
        [
            mockup.sku,
            mockup.url,
            mockup.region,
            mockup.type
        ]);
}

const saveMockupModel_Clone = (mockup) => {
    return db.query(
        `INSERT INTO mockup_url_clone 
            (sku, url, region, type) 
        VALUES 
            (?,?,?,?)
        ON DUPLICATE KEY UPDATE 
            sku = VALUES(sku),
            url = VALUES(url), 
            region = VALUES(region), 
            type = VALUES(type)`,
        [
            mockup.sku,
            mockup.url,
            mockup.region,
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
            sfp.status != 'rejected' AND
            sfp.status != 'in_production_cancelled' AND
            (sfp.tracking_code IS NULL OR sfp.tracking_code = '')  
        ORDER BY 
            sfp.date 
        DESC;`)
}

const getSwiftPODOrdersStatusModel = (swift_id) => {
    return dbRail.query(`
        SELECT 
            * 
        FROM 
            sfp_orders_webhooks sfph
        WHERE 
            sfph.swiftpod_id = ? 
        `,[swift_id])
}

const updateSwiftPODOrderStatusModel = (swift_id, data) => {
    const fieldsToUpdate = Object.keys(data).map(key => `${key} = ?`).join(', ');

    return db.query(`UPDATE swiftpod_orders SET ${fieldsToUpdate} WHERE swift_id = ?`,
        [...Object.values(data), swift_id]);
}

const getOrdersWithoutUpdateModel = () => {
    return db.query(`
        SELECT DISTINCT
            o.site_order_id, 
            o.order_id, 
            so.tracking_code,
            so.carrier 
        FROM orders o 
        JOIN swiftpod_orders so ON 
            o.site_order_id = so.site_order_id 
        WHERE 
            o.shipping_status = 'awaiting_shipment' AND 
            so.tracking_code IS NOT NULL`);
}


module.exports = {
    getIncomingOrdersModel,
    getSwiftpodBrandModel,
    getArt,
    getMock,
    getSimilarMock,
    getSimilarArt,
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
    updateSwiftPODOrderStatusModel,
    getOrdersWithoutUpdateModel,

    saveArtFrontModel_Clone,
    saveMockupModel_Clone
}