const express = require('express');
const { orderById, updateShipping } = require('../controllers/shipping_address.controller');
const router = express.Router();

router.post('/getOrderById', orderById);

router.patch('/updateShipping', updateShipping);

module.exports = router;