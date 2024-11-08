const db = require("../config/dbConfig").promise();

const saveOrder = (order) => {
  return db.query(
    `INSERT INTO blank_orders (
        order_number, order_date, site_name, total_items_quantity, total_sale_amount, 
        total_tax, total, sku, product_name, image_url, quantity, 
        sale_amount, tax_amount, total_proportional, status, tracking_number, 
        tracking_url, carrier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        tracking_number = VALUES(tracking_number),
        tracking_url = VALUES(tracking_url),
        carrier = VALUES(carrier)`,
    [
      order.order_number,
      order.order_date,
      order.site_name,
      order.total_items_quantity,
      order.total_sale_amount,
      order.total_tax,
      order.total,
      order.sku,
      order.product_name,
      order.image_url,
      order.quantity,
      order.sale_amount,
      order.tax_amount,
      order.total_proportional,
      order.status,
      order.tracking_number,
      order.tracking_url,
      order.carrier
    ]
  );
};

const getOrdersYesterdayModal = () => {
  return db.query(
    `SELECT *
     FROM blank_orders
     WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY`
  );
};

const getOrdersYesterdaySummaryModal = () => {
  return db.query(
    `SELECT 
        bo.order_number, 
        bo.site_name, 
        bo.order_date, 
        bo.total_items_quantity AS units, 
        bo.total
    FROM 
        blank_orders bo 
    WHERE 
        DATE(bo.order_date) = CURDATE() - INTERVAL 1 DAY
    GROUP BY 
        bo.order_number`
  );
};

module.exports = {
  saveOrder,
  getOrdersYesterdayModal,
  getOrdersYesterdaySummaryModal
};
