const express = require('express');
const { getOrdersBlankWalmart, getOrdersYesterday, sendMailReport } = require('../controllers/blanks.controller');
const router = express.Router();

router.get('/getOrdersBlankWalmart', getOrdersBlankWalmart)

router.get('/generateFileXLXS', generateFileXLXS);

router.get('/sendMailReport', sendMailReport)

module.exports = router;