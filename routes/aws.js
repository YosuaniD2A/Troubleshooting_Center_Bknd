const express = require('express');
const multer = require('multer');
const { uploadImages, saveUrls } = require('../controllers/aws.controller');
const router = express.Router();
const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });

router.post('/uploadImageToAWS/', upload.array("files"), uploadImages);

router.post('/saveUrls/', saveUrls);

module.exports = router;