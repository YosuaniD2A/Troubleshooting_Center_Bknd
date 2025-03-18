const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateInfoDeepSeek, generateInfoGPT, saveMetadata } = require('../controllers/ai_generator.controller');
const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });

router.post('/generateInfoGPT', upload.array("files"), generateInfoGPT)

router.post('/generateInfoDeep', upload.array("files"), generateInfoDeepSeek)

router.post('/saveMetadata', saveMetadata)

module.exports = router;