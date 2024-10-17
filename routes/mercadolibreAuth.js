const express = require('express');
const { getAuthorizationCode } = require('../controllers/mercadolibreAuth.controller');
const router = express.Router();

router.get('/getAuthorizationCode', getAuthorizationCode)

module.exports = router;