const express = require('express');
const { getPtosList, getPTO, getMockups, getMockupURLs, saveMockupDetails, getPriceRelationship } = require('../controllers/listing_generator.controller');
const router = express.Router();

router.get('/getPtosList/', getPtosList);

router.get('/getPTO/:pto', getPTO);

router.get('/getMockups/:pto', getMockups);

router.post('/getMockupURLs/', getMockupURLs);

router.post('/saveMockupDetails/', saveMockupDetails);

router.post('/getPriceRelationship/', getPriceRelationship);

module.exports = router;