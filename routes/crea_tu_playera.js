const express = require('express');
const { getCTPOrdersStatus, updateCTPOrderStatus, getKornitXOrdersStatus, getIncomingOrdersCTP, sendOrderToCTP, saveCTPOrder, setMongoCTPOrder } = require('../controllers/crea_tu_playera');
const router = express.Router();

router.post('/sendOrderToCTP', sendOrderToCTP);

router.get('/getCTPOrdersStatus', getCTPOrdersStatus);

router.get('/getKornitXOrdersStatus/:order_id', getKornitXOrdersStatus);

router.put('/updateCTPOrderStatus/:order_id', updateCTPOrderStatus);

//---------------- Routes to DB Relationship ----------------------

router.get('/getIncomingOrdersCTP/:site_order_id', getIncomingOrdersCTP);

router.post('/saveCTPOrder', saveCTPOrder);

router.post('/setMongoCTPOrder', setMongoCTPOrder);

module.exports = router;