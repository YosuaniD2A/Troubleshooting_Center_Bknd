const axios = require("axios");
const {
  saveCoppelOrderModel,
  saveCoppelOrderLinesModel,
  getOrderByOrderIdModel,
} = require("../models/coppel.model");

//TODO
//Traer ordenes en estado SHIPPING de Coppel
const fetchShippingOrders = async () => {
  try {
    const response = await axios.get(process.env.COPPEL_API_URL, {
      headers: {
        Authorization: process.env.COPPEL_AUTH_TOKEN,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      params: {
        order_state_codes: "SHIPPING",
      },
    });

    // Verifica si la respuesta es válida
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Respuesta inesperada del servidor: ${response.status}`);
    }
  } catch (error) {
    console.error(
      "Error al obtener las órdenes en estado SHIPPING:",
      error.message
    );
    throw error; // Propaga el error para manejo externo
  }
};

//Guardar las ordenes recibidas en la tabla coppel_orders y coppel_order_lines y crear orden en Shipstation
const saveCoppelOrders = async (data) => {
  try {
    const saveOrderPromises = data.orders.map(async (order) => {
      const [exist] = await getOrderByOrderIdModel(order.order_id);

      if (exist.length !== 0) return { orderId: order.order_id, success: true }; // Skip existing orders

      const respSaveOrder = await saveCoppelOrderModel(order);
      if (!respSaveOrder || respSaveOrder.affectedRows === 0) {
        return {
          orderId: order.order_id,
          success: false,
          message: `Error al guardar la orden con ID: ${order.order_id}`,
        };
      }

      const saveLinePromises = order.order_lines.map(async (line) => {
        const respSaveOrderLine = await saveCoppelOrderLinesModel(
          order.order_id,
          line
        );
        if (!respSaveOrderLine || respSaveOrderLine.affectedRows === 0) {
          return {
            orderId: order.order_id,
            success: false,
            message: `Error al guardar la línea de la orden con ID: ${order.order_id}`,
          };
        }
        return { orderId: order.order_id, success: true };
      });

      await Promise.all(saveLinePromises);

      //Crear orden en Shipstation
      const shipstationOrder = buildShipstationOrder(order);

      try {
        const shipstationResponse = await createShipstationOrder(
          shipstationOrder
        );
        if (!shipstationResponse || shipstationResponse.status !== 200) {
          return {
            orderId: order.order_id,
            success: false,
            message: `Error al crear la orden en Shipstation para el ID: ${order.order_id}`,
          };
        }
        return { orderId: order.order_id, success: true };
      } catch (error) {

        return {
          orderId: order.order_id,
          success: false,
          message: `Error al comunicarse con Shipstation para el ID: ${order.order_id}`,
        };
      }
    });

    const results = await Promise.all(saveOrderPromises);

    const failedResults = results.filter((result) => !result.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        message: `Hubo errores al guardar las órdenes: ${failedResults
          .map((r) => r.orderId)
          .join(", ")}`,
        errors: `${failedResults.map((r) => r.message).join(", ")}`,
      };
    }

    return {
      success: true,
      message: "Todas las órdenes y líneas se registraron correctamente",
    };
  } catch (error) {
    console.error(
      "Error al intentar registrar los datos en la BD:",
      error.message
    );
    throw error; // Propaga el error para manejo externo
  }
};

//Crear nueva orden en Shipstation
const createShipstationOrder = async (order) => {
  const response = await fetch(process.env.SHIP_URL_CREATEORDER, {
    method: "POST",
    headers: {
      Authorization: `Basic ${process.env.TOKENBASE64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });

  return response;
};

function buildShipstationOrder(order) {
  const shipOrder = {
    orderNumber: order.order_id,
    orderDate: order.created_date,
    orderStatus: "awaiting_shipment",
    billTo: {
      name: `${order.customer.firstname} ${order.customer.lastname}`,
      street1: order.customer.billing_address.street_1,
      street2: order.customer.billing_address.street_2,
      city: order.customer.billing_address.city,
      state: order.customer.billing_address.state,
      postalCode: order.customer.billing_address.zip_code,
      country: order.customer.billing_address.country,
      phone: order.customer.billing_address.phone,
    },
    shipTo: {
      name: `${order.customer.shipping_address.firstname} ${order.customer.shipping_address.lastname}`,
      street1: order.customer.shipping_address.street_1,
      street2: order.customer.shipping_address.street_2,
      city: order.customer.shipping_address.city,
      state: order.customer.shipping_address.state,
      postalCode: order.customer.shipping_address.zip_code,
      country: order.customer.shipping_address.country,
      phone: order.customer.shipping_address.phone,
    },
    items: order.order_lines.map((line) => ({
      sku: line.product_shop_sku,
      name: line.product_title,
      quantity: line.quantity,
      unitPrice: line.price,
      imageUrl: `https://coppel.mirakl.net${line.product_medias.find((media) => media.type === "LARGE")
        ?.media_url}`,
    })),
    internalNotes: "Coppel",
    tagIds: [113554],
    advancedOptions: {
      source: "Coppel",
    },
  };

  return shipOrder;
}

//Marcar como SHIPPED en Coppel

//Actualizar el estado de la orden y sus lines en la BD

module.exports = {
  fetchShippingOrders,
  saveCoppelOrders,
};
