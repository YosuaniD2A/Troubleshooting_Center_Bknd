const express = require('express');
const multer = require('multer');
const { uploadCSV, downloadImage, uploadCSVandDowload } = require('../controllers/image_downloader.controller');
const router = express.Router();

const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });

router.post('/upload', upload.single("file"), uploadCSVandDowload);

module.exports = router;