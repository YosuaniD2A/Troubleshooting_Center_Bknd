const express = require('express');
const { getCTPOrdersStatus, updateCTPOrderStatus, getKornitXOrdersStatus } = require('../controllers/crea_tu_playera');
const router = express.Router();

router.get('/getCTPOrdersStatus', getCTPOrdersStatus);

router.get('/getKornitXOrdersStatus/:order_id', getKornitXOrdersStatus);

router.put('/updateCTPOrderStatus/:order_id', updateCTPOrderStatus)

module.exports = router;