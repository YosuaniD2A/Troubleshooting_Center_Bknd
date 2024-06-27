const { getIncomingOrdersTPBModel, saveThePrintbarOrderModal, getAllOrdersUnshippedModel, updateOrderUnshippedModel, updateOrderShipmentModel } = require("../models/the_print_bar.model");
const { MongoClient } = require('mongodb');

const headers = {
  "Content-type": "application/json",
  "api-key": process.env.TPB_API_TOKEN,
};

const getIncomingOrdersTPB = async (req, res) => {
  try {
    const [result] = await getIncomingOrdersTPBModel();

    res.send({
      response: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const sendOrderToThePrintbar = async (req, res) => {
  try {
    const { data } = req.body;

    const body = JSON.stringify(data);
    console.log(body);
    const sendOrder = await fetch(`${process.env.TPB_BASE_URL}order`, {
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

const getOrderFromThePrintbar = async (req, res) => {
  try {
    const { orderID } = req.params;
    const sendOrder = await fetch(`${process.env.TPB_BASE_URL}order/${orderID}`, {
      headers,
      method: "GET"
    });

    const sendResponse = await sendOrder.json();
    res.send({ response: sendResponse });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}

const saveThePrintbarOrder = async (req, res) => {
  try {
    const { data } = req.body;

    const [result] = await saveThePrintbarOrderModal(data);
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

const setMongoTPBOrder = async (req, res) => {
  const uri = process.env.MONGO_URL;  // Reemplaza con el URI de tu MongoDB.
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
      const { order } = req.body;
      await client.connect();

      const database = client.db('smartprintsink');  // Reemplaza con el nombre de tu base de datos.
      const collection = database.collection('tpbOrders');
      
      const filter = { id: order.id };
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

const getAllOrdersUnshipped = async (req, res) => {
  try {
    const [result] = await getAllOrdersUnshippedModel();

    res.send({
      response: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}

const updateOrderUnshipped = async (req, res) => {
  try {
    const { order } = req.body
    console.log(order);
    const [result] = await updateOrderUnshippedModel(order);

    res.send({
      response: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}

const updateOrderShipment = async (req, res) => {
  try {
    const { order } = req.body
    const [result] = await updateOrderShipmentModel(order);

    res.send({
      response: result,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}



module.exports = {
  getIncomingOrdersTPB,
  sendOrderToThePrintbar,
  getOrderFromThePrintbar,
  saveThePrintbarOrder,
  setMongoTPBOrder,
  getAllOrdersUnshipped,
  updateOrderUnshipped,
  updateOrderShipment
};
