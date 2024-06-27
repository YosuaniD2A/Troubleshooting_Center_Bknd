const express = require('express');
const { sendOrderToSwift, getOrderFromSwift, cancelOrderFromSwift, getIncomingOrders, saveArt, saveMockup, saveShippingLabel, saveArtNeck, deleteArtNeck, saveSwiftPODOrder, getSwiftPODOrder, getSwiftPODOrdersStatus, updateSwiftPODOrderStatus, getOrdersWithoutUpdate } = require('../controllers/swiftpod.controller');
const router = express.Router();

//--------------- Routes to Handler SwiftPOD API -----------------

router.post('/sendOrderToSwift', sendOrderToSwift);

router.get('/getOrderFromSwift/:orderID', getOrderFromSwift);

router.delete('/cancelOrderFromSwift/:orderID', cancelOrderFromSwift);

//---------------- Routes to DB Relationship ----------------------

router.get('/getIncomingOrders', getIncomingOrders);

router.post('/saveArt', saveArt);

router.post('/saveMockup', saveMockup);

router.post('/saveArtNeck', saveArtNeck);

router.delete('/deleteArtNeck/:art', deleteArtNeck);

router.post('/saveShippingLabel', saveShippingLabel);

//----------------- Routes to Swiftpod_orders table -----------------------------

router.post('/saveSwiftPODOrder', saveSwiftPODOrder);

router.get('/getSwiftPODOrder', getSwiftPODOrder);

router.get('/getSwiftPODOrdersStatus/:swift_id', getSwiftPODOrdersStatus);

router.put('/updateSwiftPODOrderStatus/:order_id', updateSwiftPODOrderStatus);

router.get('/getOrdersWithoutUpdate/', getOrdersWithoutUpdate);


module.exports = router;