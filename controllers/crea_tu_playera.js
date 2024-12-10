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

const processOrdersWithoutUpdate = async (req, res) => {
    const data = req.body;

    try {
        const results = [];
        for (const order of data) {
            const payload = {
                orderId: parseInt(order.order_id),
                carrierCode: order.carrier,
                shipDate: new Date().toISOString().split('T')[0],
                trackingNumber: order.tracking_code,
                notifyCustomer: true,
                notifySalesChannel: true,
            };

            const options = {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${process.env.TOKENBASE64}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            };

            const result = await fetchWithRateLimit(process.env.SHIP_URL_MARKASSHIPPED, options);
            results.push(result);
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error processing orders:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function fetchWithRateLimit(url, options) {
    let retries = 3; // Máximo de reintentos permitidos

    while (retries > 0) {
        const response = await fetch(url, options);

        // Lee los encabezados de Rate Limiting
        const rateLimitRemaining = response.headers.get('X-Rate-Limit-Remaining');
        const rateLimitReset = response.headers.get('X-Rate-Limit-Reset');

        if (response.ok) {
            return await response.json();
        } else if (response.status === 429) {
            // Manejo de límite excedido
            const waitTime = rateLimitReset ? parseInt(rateLimitReset, 10) * 1000 : 1000;
            console.warn(`Rate limit exceeded. Retrying in ${waitTime / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        retries--;
    }

    throw new Error('Exceeded maximum retry attempts due to rate limiting.');
}

module.exports = {
    sendOrderToCTP,
    getCTPOrdersStatus,
    getKornitXOrdersStatus,
    updateCTPOrderStatus,

    getIncomingOrdersCTP,
    saveCTPOrder,
    setMongoCTPOrder,
    processOrdersWithoutUpdate
}