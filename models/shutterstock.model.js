const db = require("../config/dbConfig").promise();

const insertImageCommercialMetadata = (imageMetadata) => {
    return db.query('INSERT INTO shutterstock_prueba (shutterstock_id, description, categories, keywords, contributor, is_adult, displayname, file_size, format, is_licensable, requested_date, filename, license_id) VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),?,?)',
        [
            imageMetadata.shutterstock_id,
            imageMetadata.description,
            imageMetadata.categories,
            imageMetadata.keywords,
            imageMetadata.contributor,
            imageMetadata.is_adult,
            imageMetadata.displayname,
            imageMetadata.file_size,
            imageMetadata.format,
            imageMetadata.is_licensable,
            imageMetadata.filename,
            imageMetadata.license_id
        ]);
}

const insertImageEditorialMetadata = (imageMetadata) => {
    return db.query('INSERT INTO shutterstock_prueba (shutterstock_id, description, categories, keywords, displayname,  is_licensable, requested_date, filename, license_id) VALUES (?,?,?,?,?,?,NOW(),?,?)',
        [
            imageMetadata.shutterstock_id,
            imageMetadata.description,
            imageMetadata.categories,
            imageMetadata.keywords,
            imageMetadata.displayname,
            imageMetadata.is_licensable,
            imageMetadata.filename,
            imageMetadata.license_id
        ]);
}

const getImageMetadata = (imageMetadataId) => {
    return db.query('SELECT *  FROM shutterstock_prueba WHERE shutterstock_id = ?', [imageMetadataId]);
}

const getOrdersWithShutterId = (date) => {
    return db.query(
    `SELECT
        o.sku,
        o.order_date,
        sm.shutterstock_id,
        round(o.unit_price,2) unit_price,
        o.quantity
    FROM
        orders o join
        brand_dictionary b on substr(o.sku, 1, 2) = b.literals JOIN
        shutterstock_metadata sm on cast(substr(o.sku, 3, 8) as signed) = sm.id
    WHERE
        DATE(o.order_date) = ? AND 
        o.proportional > 0 AND 
        o.shipping_status not in('cancelled', 'refunded') AND
        b.licensor = 'Shutterstock' AND
        b.active = 1
    ORDER BY
        o.order_date;`,
    [date]
    )
}

const insertOrderShutterstockReport = (order) => {
    return db.query(
        `INSERT INTO shutterstock_license_report 
            (shutterstock_id, 
            order_date, 
            license_account, 
            unit_price, 
            shutterstock_16_percent_revshare,  
            license, 
            licensed_time) 
        VALUES 
            (?,?,?,?,?,?,?)`,
        [
            order.shutterstock_id,
            order.order_date,
            order.license_account,
            order.price,
            order.revsahre,
            order.license,
            order.licensed_time
        ]);
}

const getReportSendToday = (date) => {
    return db.query('SELECT * FROM shutterstock_license_report shr WHERE DATE(shr.order_date) = ?',[date])
}

module.exports = {
    insertImageCommercialMetadata,
    insertImageEditorialMetadata,
    getImageMetadata,
    getOrdersWithShutterId,
    insertOrderShutterstockReport,
    getReportSendToday
}