const express = require('express');
const { getPtosList, getPTO, getMockups, getMockupURLs } = require('../controllers/listing_generator.controller');
const router = express.Router();

router.get('/getPtosList/', getPtosList);

router.get('/getPTO/:pto', getPTO);

router.get('/getMockups/:pto', getMockups);

router.get('/getMockupURLs/', getMockupURLs);

module.exports = router;