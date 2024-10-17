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
            ctp.status != 520 AND  
            ctp.status != 516 AND 
            ctp.status != 128 AND 
            ctp.date > STR_TO_DATE('2024-04-04', '%Y-%m-%d') 
        ORDER BY 
            ctp.date 
        DESC;`);
};

const getKornitXOrdersStatusModel = (order_id) => {
  return dbRail.query(
    `
        SELECT 
            * 
        FROM 
            ctp_orders_kornitx ctpk
        WHERE 
            ctpk.order_id = ? 
        `,
    [order_id]
  );
};

const updateCTPOrderStatusModel = (order_id, data) => {
  const fieldsToUpdate = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");

  return db.query(
    `UPDATE crea_tu_playera_orders SET ${fieldsToUpdate} WHERE order_id = ?`,
    [...Object.values(data), order_id]
  );
};

//------------------------------------------------------------------------------------

const getIncomingOrdersCTPModel = (site_order_id) => {
  return db.query(
    `call crea_tu_playera_incoming_orders_kornit(?)`,
    [site_order_id]
  );
};

const saveCTPOrderModal = (ctpOrder) => {
  return db.query(
    `INSERT INTO
        crea_tu_playera_orders(
            site_order_id,
            site_name,
            id_ctp,
            date,
            status,
            carrier,
            tracking_number,
            order_id
        )
    VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ctpOrder.external_ref,
      ctpOrder.site_name,
      ctpOrder.id,
      ctpOrder.date,
      ctpOrder.status,
      ctpOrder.shipping_carrier,
      ctpOrder.shipping_tracking,
      ctpOrder.order_id,
    ]
  );
};

const getOrderIDAndSiteName = (site_order_id) => {
  return db.query(
    `select order_id, site_name from orders where site_order_id = ?`,
    [site_order_id]
  );
};

module.exports = {
  getCTPOrdersStatusModel,
  getKornitXOrdersStatusModel,
  updateCTPOrderStatusModel,

  getIncomingOrdersCTPModel,
  saveCTPOrderModal,
  getOrderIDAndSiteName
};
