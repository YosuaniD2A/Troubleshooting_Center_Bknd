const { generateTokenBase64 } = require("../Utilities/crea_tu_playera.utilities");
const { getCTPOrdersStatusModel, updateCTPOrderStatusModel, getKornitXOrdersStatusModel, getIncomingOrdersCTPModel, saveCTPOrderModal, getOrderIDAndSiteName } = require("../models/crea_tu_playera");
const { MongoClient } = require('mongodb');

const sendOrderToCTP = async (req, res) => {
    try {
      const { payload, apiKey, companyRefId } = req.body;
      const token = generateTokenBase64(companyRefId, apiKey)

      const headers = {
        "Content-type": "application/json",
        Authorization: `Basic ${token}`,
      };
    
     
      const body = JSON.stringify(payload);
      console.log(body);
      const sendOrder = await fetch(`${process.env.CTP_BASE_URL}`, {
        headers,
        method: "POST",
        body,
      });
  
      const sendResponse = await sendOrder.json();
      res.send({ response: sendResponse });

    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  };

const getCTPOrdersStatus = async (req, res) => {
    try {

        const [data] = await getCTPOrdersStatusModel();

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getKornitXOrdersStatus = async (req, res) => {
    try {
        const order_id = req.params.order_id
        const [data] = await getKornitXOrdersStatusModel(order_id);

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const updateCTPOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.order_id;
        const data = req.body;
        console.log(orderId);
        console.log(data);
        const [result] = await updateCTPOrderStatusModel(orderId, data);

        res.send({
            data: result
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

//------------------------------------------------------------------------------------

const getIncomingOrdersCTP = async (req, res) => {
    try {
        const site_order_id = req.params.site_order_id;
        const [result] = await getIncomingOrdersCTPModel(site_order_id);

        res.send({
            data: result
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const saveCTPOrder = async (req, res) => {
    try {
      const { data, siteOrderId } = req.body;
      const [resp] = await getOrderIDAndSiteName(siteOrderId);

      data.site_name = resp[0].site_name;
      data.order_id = resp[0].order_id;

      console.log(data);

      const [result] = await saveCTPOrderModal(data);
      res.send({
        response: result,
      });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: error.message,
      });
    }
};

const setMongoCTPOrder = async (req, res) => {
    const uri = process.env.MONGO_URL;  // Reemplaza con el URI de tu MongoDB.
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        const { order } = req.body;
        await client.connect();

        const database = client.db('smartprintsink');  // Reemplaza con el nombre de tu base de datos.
        const collection = database.collection('creaTuPlayeraOrders');
        
        const filter = { external_ref: order.externalRef };
        const update = { $set: order };
        const options = { upsert: true };

        const result = await collection.updateOne(filter, update, options);

        res.send({
            response: result,
        });

    } catch (error) {
        console.log(error);
      res.status(500).json({
        error: error.message,
      });
    } finally {
        await client.close();
    }
};

module.exports = {
    sendOrderToCTP,
    getCTPOrdersStatus,
    getKornitXOrdersStatus,
    updateCTPOrderStatus,

    getIncomingOrdersCTP,
    saveCTPOrder,
    setMongoCTPOrder
}