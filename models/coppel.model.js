const db = require("../config/dbConfig").promise();

const getOrderByOrderIdModel = (orderId) => {
    return db.query(
        `SELECT order_id FROM coppel_orders WHERE order_id = ?`,
        [orderId]
      );
}

const saveCoppelOrderModel = (data) => {
  return db.query(
    `
        INSERT INTO coppel_orders (
          commercial_id, order_id, created_date, acceptance_date, firstname, lastname,
          shipping_city, shipping_state, shipping_country, shipping_zipcode, street_1, street_2,
          customer_debited_date, customer_notification_email, order_state, payment_method,
          price, total_commission, total_price, shipping_company, shipping_price, shipping_tracking,
          shipping_tracking_url, shipping_type_code, shipping_zone_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
    [
      data.commercial_id,
      data.order_id,
      data.created_date ? new Date(data.created_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      data.acceptance_decision_date ? new Date(data.acceptance_decision_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      data.customer.firstname,
      data.customer.lastname,
      data.customer.shipping_address.city,
      data.customer.shipping_address.state,
      data.customer.shipping_address.country,
      data.customer.shipping_address.zip_code,
      data.customer.shipping_address.street_1,
      data.customer.shipping_address.street_2,
      data.customer_debited_date ? new Date(data.customer_debited_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      data.customer_notification_email,
      data.order_state,
      data.payment_type,
      data.price,
      data.total_commission,
      data.total_price,
      data.shipping_company,
      data.shipping_price,
      data.shipping_tracking,
      data.shipping_tracking_url,
      data.shipping_type_code,
      data.shipping_zone_code,
    ]
  );
};

const saveCoppelOrderLinesModel = (orderId, data) => {
  return db.query(
    `INSERT INTO coppel_order_lines (
            order_id, order_line_id, product_sku, product_title, offer_id, offer_sku,
            quantity, price_unit, price, total_comission, total_price, order_line_state,
            shipped_date, received_date, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
    [
      orderId,
      data.order_line_id,
      data.product_sku,
      data.product_title,
      data.offer_id,
      data.offer_sku,
      data.quantity,
      data.price_unit,
      data.price,
      data.total_commission,
      data.total_price,
      data.order_line_state,
      data.shipped_date ? new Date(data.shipped_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      data.received_date ? new Date(data.received_date).toISOString().slice(0, 19).replace('T', ' ') : null,
      data.product_medias[0].media_url,
    ]
  );
};

module.exports = {
  saveCoppelOrderModel,
  saveCoppelOrderLinesModel,
  getOrderByOrderIdModel
};
