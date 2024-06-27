const db = require("../config/dbConfig").promise();

const getIncomingOrdersTPBModel = () => {
  return db.query(`call the_print_bar_incoming_orders()`);
};

const saveThePrintbarOrderModal = (tpbOrder) => {
  return db.query(
    `INSERT INTO
      the_print_bar_orders (
        date,
        order_number,
        reference_id,
        turn_around,
        tpb_status,
        tpb_signal,
        order_id
      )
      values (current_date,?,?,?,?,'created',(SELECT order_id FROM orders o WHERE site_order_id = ? limit 1));`,
    [
      tpbOrder.id,
      tpbOrder.referenceId,
      tpbOrder.turnAround,
      tpbOrder.status,
      tpbOrder.id,
    ]
  );
};

const getAllOrdersUnshippedModel = () => {
  return db.query(
    `SELECT * FROM the_print_bar_orders WHERE tpb_signal != 'shipped' AND tpb_signal != 'cancelled' AND date > '2024-05-31'`
  );
};

const updateOrderUnshippedModel = (order) => {
  return db.query(
    `UPDATE
      the_print_bar_orders
    SET
      tpb_signal = ?
    WHERE
      order_number = ?
      and reference_id = ?`,
    [order.signal, order.order_number, order.reference_id]
  );
};

const updateOrderShipmentModel = (order) => {
  return db.query(
    `UPDATE
      the_print_bar_orders
    SET
      tpb_signal = ?,
      carrier = ?,
      tracking_number = ?,
      ship_date = ?,
      tracking_url = ?
    WHERE
      order_number = ?
      and reference_id = ?`,
    [
      order.signal, 
      order.carrier, 
      order.tracking_number, 
      order.ship_date, 
      order.tracking_url, 
      order.order_number, 
      order.reference_id
    ]
  );
};

module.exports = {
  getIncomingOrdersTPBModel,
  saveThePrintbarOrderModal,
  getAllOrdersUnshippedModel,
  updateOrderUnshippedModel,
  updateOrderShipmentModel,
};
