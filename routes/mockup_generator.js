const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });
const { getMockupsFromDynamic, sendToRenderMockups, selectColorByStyle } = require('../controllers/mockup-generator.controller');

router.get('/getMockupsFromDynamic', getMockupsFromDynamic)

router.post('/sendToRenderMockups', upload.array("files"), sendToRenderMockups)

router.post('/getColorsByStyle', selectColorByStyle)

module.exports = router;