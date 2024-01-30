const express = require('express');
const { ordersWithoutSP_Id, sizesType, suggestions, insertDesignID, deleteElem } = require('../controllers/scalablepress.controller');
const router = express.Router();

router.get('/getOrdersWithoutSP_Id', ordersWithoutSP_Id);

router.get('/getSizes', sizesType);

router.post('/getSuggestions', suggestions);

router.put('/insertDictionary', insertDesignID);

router.delete('/deleteOrder/:id', deleteElem);


module.exports = router;