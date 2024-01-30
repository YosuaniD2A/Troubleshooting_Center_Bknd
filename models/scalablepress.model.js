const db = require("../config/dbConfig").promise();

const getOrdersWithoutSP_Id = () => {
    return db.query("SELECT * FROM scalable_press_orders sp WHERE  sp.scalable_press_id = '' OR sp.scalable_press_id IS NULL")
}

const getSizes = () => {
    return db.query("SELECT sp.size FROM scalable_press_dictionary sp WHERE sp.size IS NOT NULL AND sp.size != '' GROUP BY sp.size")
}

const getSuggestions = (back) => {
    return db.query("SELECT * FROM scalable_press_dictionary sp WHERE sp.sku like ? limit 3",['%'+back])
}

const insertDictionary = (date, sku, size, size_translation, design_id) => {
    return db.query("INSERT INTO scalable_press_dictionary (uploaded_date, sku, size, size_translation, design_id) VALUES (?, ?, ?, ?, ?)",
    [date, sku, size, size_translation, design_id])
}

const deleteOrder = (id) => {
    return db.query("DELETE FROM scalable_press_orders sp WHERE sp.id = ?",[id])
}

module.exports = {
    getOrdersWithoutSP_Id,
    getSizes,
    getSuggestions,
    insertDictionary,
    deleteOrder
}