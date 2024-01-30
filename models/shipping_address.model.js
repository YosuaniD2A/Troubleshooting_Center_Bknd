const db = require("../config/dbConfig").promise();

const getOrderById = (id) => {
    return db.query("SELECT * FROM orders o WHERE  o.site_order_id = ?", [id])
}

const updateShippingAddress = (data) => {
    return db.query("UPDATE orders SET street_1 = ?, shipping_city = ?, shipping_state_province = ?, shipping_country = ?, shipping_postal_code = ? WHERE id = ?",
        [
            data.street,
            data.shipping_city,
            data.shipping_state_province,
            data.shipping_country,
            data.shipping_postal_code,
            data.id
        ])
}

module.exports = {
    getOrderById,
    updateShippingAddress
}