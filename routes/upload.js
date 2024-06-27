const express = require('express');
const multer = require('multer');
const { uploadImages } = require('../controllers/upload.controller');
const router = express.Router();

const storage = require("../config/multerConfig").storage;
const upload = multer({ storage });

router.post('/uploadImage', upload.array("files"), uploadImages);


module.exports = router;