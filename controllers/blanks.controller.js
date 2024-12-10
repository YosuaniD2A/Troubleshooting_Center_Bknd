const { getOrdersYesterdayModal } = require("../models/blanks.model");
const {
  processOrdersBlankWalmart,
  exportXlxs,
  sendMail,
} = require("../Utilities/blanks");

const getOrdersBlankWalmart = async (req, res) => {
  try {
    const result = await processOrdersBlankWalmart();
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
};

const generateFileXLXS = async (req, res) => {
  try {
    const result = await exportXlxs();
    res.json(result);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ msg: error.message });
  }
};

const sendMailReport = async (req, res) => {
  try {
    const result = await sendMail();
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getOrdersBlankWalmart,
  generateFileXLXS,
  sendMailReport,
};
