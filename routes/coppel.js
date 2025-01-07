const express = require('express');
const { getOrders, markAsShipped } = require('../controllers/coppel.controller');
const router = express.Router();

router.get('/getOrders', getOrders);

router.get('/markAsShipped/:order_id', markAsShipped)


module.exports = router;