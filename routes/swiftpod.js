const express = require('express');
const { sendOrderToSwift, getOrderFromSwift, cancelOrderFromSwift, getIncomingOrders, saveArt, saveMockup, saveShippingLabel, saveArtNeck, deleteArtNeck, saveSwiftPODOrder, getSwiftPODOrder, getSwiftPODOrdersStatus, updateSwiftPODOrderStatus, getOrdersWithoutUpdate, linkMockup, linkArt, getSwiftpodBrand } = require('../controllers/swiftpod.controller');
const router = express.Router();

//--------------- Routes to Handler SwiftPOD API -----------------

router.post('/sendOrderToSwift/:siteName', sendOrderToSwift);

router.get('/getOrderFromSwift/:orderID', getOrderFromSwift);

router.delete('/cancelOrderFromSwift/:orderID', cancelOrderFromSwift);

//---------------- Routes to DB Relationship ----------------------

router.get('/getIncomingOrders', getIncomingOrders);

router.get('/getSwiftpodBrand/:design', getSwiftpodBrand);

router.post('/linkMockup', linkMockup);

router.post('/linkArt', linkArt);

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