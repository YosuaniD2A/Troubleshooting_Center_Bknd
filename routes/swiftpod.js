const express = require('express');
const { sendOrderToSwift, getOrderFromSwift, cancelOrderFromSwift, getIncomingOrders, saveArt, saveMockup } = require('../controllers/swiftpod.controller');
const router = express.Router();

//--------------- Routes to Handler SwiftPOD API -----------------

router.post('/sendOrder', sendOrderToSwift);

router.get('/getOrder/:orderID', getOrderFromSwift);

router.delete('/cancelOrder/:orderID', cancelOrderFromSwift);

//---------------- Routes to DB Relationship ----------------------

router.get('/getIncomingOrders', getIncomingOrders);

router.post('/saveArt', saveArt);

router.post('/saveMockup', saveMockup);


module.exports = router;