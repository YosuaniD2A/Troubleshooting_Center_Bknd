const express = require('express');
const router = express.Router();
const { 
  getStores, 
  getSalesSumary, 
  getSalesPeriod, 
  getSalesStores, 
  getSalesBrands, 
  getSalesShutterstockSplit,
  getSalesSumaryByMonths, 
  getSalesByStore, 
  getMarks,
  getSalesByMarks} = require('../controllers/sales_report.controller');


router.get('/storeList', getStores);

router.get('/marksList', getMarks);

router.post('/salesSummary', getSalesSumary);

router.post('/salesSummaryByMonths', getSalesSumaryByMonths);

router.post('/salesPeriod', getSalesPeriod);

router.post('/salesStores', getSalesStores);

router.post('/salesBrands', getSalesBrands);

router.post('/salesShutterstock', getSalesShutterstockSplit);

router.post('/salesByStore', getSalesByStore);

router.post('/salesByMark', getSalesByMarks);

module.exports = router;