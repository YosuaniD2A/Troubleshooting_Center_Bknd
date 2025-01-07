const axios = require("axios");
const {
  fetchShippingOrders,
  saveCoppelOrders,
} = require("../Utilities/coppel.utilities");

const getOrders = async (req, res) => {
  try {
    // Cargar ordenes de Coppel en estado SHIPPING
    const shippingOrders = await fetchShippingOrders();

    if (
      !shippingOrders ||
      !shippingOrders.orders ||
      shippingOrders.orders.length === 0
    ) {
      return res.status(404).json({
        msg: "No se encontraron órdenes para procesar.",
      });
    }
    // Guardar orden en la BD
    const saveResult = await saveCoppelOrders(shippingOrders);

    if (!saveResult.success) {
      return res.status(400).json({
        msg: saveResult.message,
        error: saveResult.errors ? saveResult.errors : null,
      });
    }

    res.status(200).json({
      msg: "Órdenes procesadas correctamente",
      orders: shippingOrders.orders,
    });
  } catch (error) {
    console.error("Error al procesar las órdenes:", error.message);
    res.status(500).json({
      msg: "Hubo un problema al procesar las órdenes. Intente nuevamente.",
    });
  }
};

const markAsShipped = async (req, res) => {
  try {
    const { order_id } = req.params;
    const markAsShippedURL =
      "https://coppel.mirakl.net/api/orders/{order_id}/ship";
    const defaultHeaders = {
      Authorization: process.env.COPPEL_AUTH_TOKEN,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Construir los headers y URL dinámicos
    const headers = { ...defaultHeaders };
    const pathParams = { order_id };
    const url = parsePathParams(markAsShippedURL, pathParams);

    const response = await axios.put(url, {}, { headers });

    if (response.status === 204) {
      console.log(`La orden ${order_id} fue marcada como enviada.`);

      res.json({
        msg:
          "La orden fue marcada como enviada (shipped) satisfactoriamente.",
      });
    } else {
      // Si el status no es 204, envía la respuesta estándar
      res.send({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }
  } catch (error) {
    console.error("Error al marcar la orden como shipped:", error);
    res.status(500).json({
      msg: "Hubo un problema al marcar la orden. Intente nuevamente.",
    });
  }
};

function parsePathParams(url, params) {
  let parsedUrl = url;
  for (const [key, value] of Object.entries(params)) {
    parsedUrl = parsedUrl.replace(`{${key}}`, value);
  }
  return parsedUrl;
}

module.exports = {
  getOrders,
  markAsShipped,
};
