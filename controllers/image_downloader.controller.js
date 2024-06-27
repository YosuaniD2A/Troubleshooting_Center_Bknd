const fs = require("fs");
const csv = require("csv-parser");
const {
  importCSVofImages,
  downloadImages,
} = require("../Utilities/general.utilities");

const uploadCSVandDowload = async (req, res) => {
  try {
    const filePath = req.file.path;
    const listOfImages = await importCSVofImages(
      fs.createReadStream(filePath).pipe(csv())
    );

    const result = await Promise.all(
      listOfImages.map(async (image) => {
        if (image !== null) {
          return await downloadImages(image);
        } else {
          return null;
        }
      })
    );

    res.send({ data: result });

  } catch (error) {
    res.status(500).json({
      msg: error.message,
    });
  }
};


module.exports = {
  uploadCSVandDowload,
};
