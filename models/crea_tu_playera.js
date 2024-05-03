const db = require("../config/dbConfig").promise();
const dbRail = require("../config/railwayDbConfig").promise();

const getCTPOrdersStatusModel = () => {
    return db.query(`
        SELECT 
            * 
        FROM 
            crea_tu_playera_orders ctp 
        WHERE 
            ctp.status != 8 AND 
            ctp.status != 516 AND 
            ctp.status != 128 AND 
            ctp.date > STR_TO_DATE('2024-04-04', '%Y-%m-%d') 
        ORDER BY 
            ctp.date 
        DESC;`)
}

const getKornitXOrdersStatusModel = (order_id) => {
    return dbRail.query(`
        SELECT 
            * 
        FROM 
            ctp_orders_kornitx ctpk
        WHERE 
            ctpk.order_id = ? 
        `,[order_id])
}

const updateCTPOrderStatusModel = (order_id, data) => {
    const fieldsToUpdate = Object.keys(data).map(key => `${key} = ?`).join(', ');

    return db.query(`UPDATE crea_tu_playera_orders SET ${fieldsToUpdate} WHERE order_id = ?`,
        [...Object.values(data), order_id]);
}

module.exports = {
    getCTPOrdersStatusModel,
    getKornitXOrdersStatusModel,
    updateCTPOrderStatusModel

}