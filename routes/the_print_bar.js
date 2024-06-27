const express = require('express');
const router = express.Router();
const { getIncomingOrdersTPB, sendOrderToThePrintbar, saveThePrintbarOrder, getOrderFromThePrintbar, setMongoTPBOrder, getAllOrdersUnshipped, updateOrderUnshipped, updateOrderShipment } = require("../controllers/the_print_bar.controller");

router.get('/getIncomingOrdersTPB', getIncomingOrdersTPB);

router.post('/sendOrderToThePrintbar', sendOrderToThePrintbar);

router.get('/getOrderFromThePrintbar/:orderID', getOrderFromThePrintbar);

router.post('/saveThePrintbarOrder', saveThePrintbarOrder);

router.post('/setMongoTPBOrder', setMongoTPBOrder);

router.get('/getAllOrdersUnshipped', getAllOrdersUnshipped);

router.put('/updateOrderUnshipped', updateOrderUnshipped);

router.put('/updateOrderShipment', updateOrderShipment);

module.exports = router;