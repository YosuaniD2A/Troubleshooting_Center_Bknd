const express = require('express');
const { getPtosList, getPTO, getMockups, getMockupURLs, saveMockupDetails, getPriceRelationship, getLastMPN, updatePTOs, getColors } = require('../controllers/listing_generator.controller');
const router = express.Router();

router.get('/getPtosList/', getPtosList);

router.get('/getPTO/:pto', getPTO);

router.get('/getMockups/:pto', getMockups);

router.get('/getLastMPN/', getLastMPN);

router.get('/getColors/', getColors);

router.post('/updatePTOs/', updatePTOs);

router.post('/getMockupURLs/', getMockupURLs);

router.post('/saveMockupDetails/:pto', saveMockupDetails);

router.post('/getPriceRelationship/', getPriceRelationship);

module.exports = router;