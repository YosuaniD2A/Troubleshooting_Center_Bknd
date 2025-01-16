const { MongoClient } = require("mongodb");
const {
  saveOrder,
  getOrdersYesterdaySummaryModal,
  getOrdersYesterdayModal,
} = require("../models/blanks.model");
const ExcelJS = require("exceljs");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { format, subDays } = require("date-fns");
const { transporter } = require("../config/nodemailer");
const { report_template } = require("./templates");

const processOrdersBlankWalmart = async () => {
  // const client = new MongoClient(
  //   "mongodb://d2:D2America$0@bodega2tsg.ddns.net:28018/?authMechanism=DEFAULT&authSource=swiftpod"
  // );
  const client = new MongoClient(
    "mongodb://d2:D2America$0@189.222.207.169:28018/?authMechanism=DEFAULT&authSource=swiftpod"
  );
  try {
    await client.connect();
    const coll = client.db("swiftpod").collection("walmartOrders");

    const agg = [
      {
        $match: {
          $expr: {
            $gte: [
              { $toDate: "$orderDate" },
              // new Date('Tue, 15 Oct 2024 00:00:00 GMT')
              new Date(new Date().setDate(new Date().getDate() - 3)),
            ],
          },
        },
      },
      {
        $project: {
          orderNumber: "$customerOrderId",
          purchaseOrderId: 1,
          orderDate: { $toDate: "$orderDate" },
          destination: "$shippingInfo.postalAddress",
          items: "$orderLines.orderLine",
        },
      },
      {
        $unwind: {
          path: "$items",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $unwind: {
          path: "$items.charges.charge",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$orderNumber",
          data: { $push: "$$ROOT" },
          totalQuantity: {
            $sum: { $toInt: "$items.orderLineQuantity.amount" },
          },
          totalAmount: { $sum: "$items.charges.charge.chargeAmount.amount" },
          totalTax: { $sum: "$items.charges.charge.tax.taxAmount.amount" },
        },
      },
      {
        $lookup: {
          from: "swiftpodOrders",
          localField: "data.purchaseOrderId",
          foreignField: "order_id",
          as: "swiftpodData",
        },
      },
      {
        $unwind: {
          path: "$swiftpodData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          purchaseOrder: { $first: "$data.purchaseOrderId" },
          orderDate: { $first: "$data.orderDate" },
          totalQuantity: 1,
          totalAmount: 1,
          totalTax: 1,
          total: { $add: ["$totalAmount", "$totalTax"] },
          products: {
            $map: {
              input: { $range: [0, { $size: "$data.items" }] },
              as: "index",
              in: {
                productDetails: {
                  $arrayElemAt: ["$data.items.item", "$$index"],
                },
                quantity: {
                  $toInt: {
                    $arrayElemAt: [
                      "$data.items.orderLineQuantity.amount",
                      "$$index",
                    ],
                  },
                },
                saleAmount: {
                  $arrayElemAt: [
                    "$data.items.charges.charge.chargeAmount.amount",
                    "$$index",
                  ],
                },
                taxAmount: {
                  $arrayElemAt: [
                    "$data.items.charges.charge.tax.taxAmount.amount",
                    "$$index",
                  ],
                },
                total: {
                  $add: [
                    {
                      $arrayElemAt: [
                        "$data.items.charges.charge.chargeAmount.amount",
                        "$$index",
                      ],
                    },
                    {
                      $ifNull: [
                        {
                          $arrayElemAt: [
                            "$data.items.charges.charge.tax.taxAmount.amount",
                            "$$index",
                          ],
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
          status: "$swiftpodData.status",
          trackingNumber: {
            $arrayElemAt: ["$swiftpodData.trackings.tracking_number", 0],
          },
          trackingUrl: {
            $arrayElemAt: ["$swiftpodData.trackings.tracking_url", 0],
          },
          carrier: {
            $arrayElemAt: ["$swiftpodData.trackings.carrier", 0],
          },
        },
      },
    ];

    const cursor = coll.aggregate(agg);
    const orders = await cursor.toArray();

    const ordersBuilded = orders.flatMap((order) =>
      order.products.map((product) => ({
        order_number: order.purchaseOrder,
        order_date: order.orderDate,
        site_name: "Walmart",
        total_items_quantity: order.totalQuantity,
        total_sale_amount: order.totalAmount,
        total_tax: order.totalTax,
        total: order.total,

        sku: product.productDetails.sku,
        product_name: product.productDetails.productName,
        image_url: product.productDetails.imageUrl,
        quantity: product.quantity,
        sale_amount: product.saleAmount,
        tax_amount: product.taxAmount,
        total_proportional: product.total,

        status: order.status,
        tracking_number: order.trackingNumber,
        tracking_url: order.trackingUrl,
        carrier: order.carrier,
      }))
    );

    const ordersUnique = {};

    ordersBuilded.forEach((order) => {
      const key = `${order.order_number}-${order.sku}`; // Crear una clave única basada en order_number y sku

      if (ordersUnique[key]) {
        // Si la clave ya existe, incrementar la cantidad del producto existente
        ordersUnique[key].quantity += order.quantity;
      } else {
        // Si es una nueva combinación, añadir el producto al objeto de acumulación
        ordersUnique[key] = order;
      }
    });

    // Convertir el objeto acumulado en un array
    const finalOrders = Object.values(ordersUnique);

    const result = await Promise.all(
      finalOrders.map(async (order) => {
        const resp = await saveOrder(order); // Obtener el id de la orden insertada
        if (resp[0].insertId !== 0) {
          // Solo incluir órdenes que sufrieron cambios
          return {
            response: `Order ${order.order_number} inserted or updated with ID: ${resp[0].insertId}`,
          };
        }
        return null;
      })
    );

    return result.filter((elem) => elem); // Enviar los datos como respuesta en caso de éxito
  } catch (error) {
    throw new Error(error.message);
  } finally {
    await client.close();
  }
};

const exportXlxs = async () => {
  const [data] = await getOrdersYesterdayModal();
  const [summaryData] = await getOrdersYesterdaySummaryModal();

  const groupedOrders = data.reduce((acc, order) => {
    // Verifica si el order_number ya está en el acumulador
    let existingOrder = acc.find((o) => o.order_number === order.order_number);

    if (!existingOrder) {
      // Si la orden no existe en el acumulador, crea una nueva entrada
      existingOrder = {
        order_number: order.order_number,
        order_date: order.order_date,
        site_name: order.site_name,
        total_items_quantity: order.total_items_quantity,
        total_sale_amount: order.total_sale_amount,
        total_tax: order.total_tax,
        total: order.total,
        status: order.status,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        carrier: order.carrier,
        items: [], // Crea un array para los elementos de la orden
      };
      acc.push(existingOrder);
    }

    // Agrega el item actual al array de items dentro de la orden
    existingOrder.items.push({
      sku: order.sku,
      product_name: order.product_name,
      image_url: order.image_url,
      quantity: order.quantity,
      sale_amount: order.sale_amount,
      tax_amount: order.tax_amount,
      total_proportional: order.total_proportional,
    });

    return acc;
  }, []);

  // Obtener la fecha de ayer
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1); // Restar un día

  // Generar la fecha actual en el formato Day DD MMM YYYY
  const dateFromReport = yesterday.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Crea el archivo Excel
  const workbook = new ExcelJS.Workbook();

  // 1. Crear la hoja de Resumen
  const summarySheet = workbook.addWorksheet("Summary");

  // Encabezado principal "Summary" en A1:E1
  const titleRow = summarySheet.addRow([
    `Report Date: ${dateFromReport}`,
    null,
  ]);
  summarySheet.mergeCells("A1:E1");
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB0E0E6" }, // Azul claro
  };

  // Establecer ancho de columnas
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 15;
  summarySheet.getColumn(3).width = 15;
  summarySheet.getColumn(4).width = 15;
  summarySheet.getColumn(5).width = 15;

  // Encabezados para el resumen general en la fila 2
  summarySheet.getRow(2).values = [
    "",
    "Revenue",
    "Orders",
    "Units",
    "Average Sale",
  ];
  summarySheet.getRow(2).font = { bold: true };
  summarySheet.getRow(2).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  summarySheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Valores del resumen general en la fila 3
  const generalSummary = getGeneralSummary(summaryData);
  summarySheet.getRow(3).values = [
    "Summary",
    parseFloat(generalSummary.Revenue),
    parseInt(generalSummary.Orders),
    parseInt(generalSummary.Units),
    parseFloat(generalSummary.Average_Sale),
  ];

  // Formato numérico para celdas de ingresos y promedio de ventas
  summarySheet.getCell("B3").numFmt = '"$"#,##0.00';
  summarySheet.getCell("E3").numFmt = '"$"#,##0.00';

  // Aplicar bordes a las celdas de valores de la fila 3
  summarySheet.getRow(3).eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Fila vacía en la fila 4
  summarySheet.addRow([]);

  // Encabezado "Sales by Stores" en A5:D5
  const salesByStoreRow = summarySheet.addRow(["Sales by Stores"]);
  summarySheet.mergeCells("A5:E5");
  salesByStoreRow.font = { bold: true, size: 12 };
  salesByStoreRow.alignment = { horizontal: "center", vertical: "middle" };
  salesByStoreRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB0E0E6" },
  };

  // Encabezados para cada tienda en la fila 6
  summarySheet.getRow(6).values = [
    "Store",
    "Revenue",
    "Orders",
    "Units",
    "Average Sale",
  ];
  summarySheet.getRow(6).font = { bold: true };
  summarySheet.getRow(6).alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  summarySheet.getRow(6).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Agregar valores por cada tienda en las filas siguientes
  const summaryBySite = getSummaryBySite(summaryData);
  let rowIndex = 7;
  for (const [store, summary] of Object.entries(summaryBySite)) {
    const row = summarySheet.addRow([
      store,
      parseFloat(summary.Revenue),
      parseInt(summary.Orders),
      parseInt(summary.Units),
      parseFloat(summary.Average_Sale),
    ]);
    row.getCell(2).numFmt = '"$"#,##0.00'; // Formato numérico de Revenue
    row.getCell(5).numFmt = '"$"#,##0.00'; // Formato numérico de Average Sale

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    rowIndex++;
  }

  // 2. Crear la hoja de Detalles de Órdenes
  const ordersSheet = workbook.addWorksheet("Order Details");
  ordersSheet.columns = [
    { header: "Order Number", key: "order_number", width: 15 },
    { header: "Order Date", key: "order_date", width: 20 },
    { header: "Site Name", key: "site_name", width: 20 },
    { header: "SKU", key: "sku", width: 15 },
    { header: "Product Name", key: "product_name", width: 25 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Sale Amount", key: "sale_amount", width: 15 },
    { header: "Tax Amount", key: "tax_amount", width: 10 },
    { header: "Total", key: "total_proportional", width: 15 },
  ];

  // Estilos para encabezados
  ordersSheet.columns.forEach((col, index) => {
    const cell = ordersSheet.getCell(1, index + 1);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
  });

  groupedOrders.forEach((order) => {
    order.items.forEach((item) => {
      ordersSheet.addRow({
        order_number: order.order_number,
        order_date: order.order_date,
        site_name: order.site_name,
        sku: item.sku,
        product_name: item.product_name,
        quantity: item.quantity,
        sale_amount: item.sale_amount,
        tax_amount: item.tax_amount,
        total_proportional: item.total_proportional,
      });
    });
  });

  // 3. Crear la hoja de Diseños Más Vendidos con Imágenes
  const designsSheet = workbook.addWorksheet("Top Designs");
  designsSheet.columns = [
    { header: "SKU", key: "sku", width: 15 },
    { header: "Product Name", key: "product_name", width: 25 },
    { header: "Quantity Sold", key: "quantity", width: 15 },
    { header: "Image", key: "image", width: 30 },
  ];

  designsSheet.columns.forEach((col, index) => {
    const cell = designsSheet.getCell(1, index + 1);
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0E0E6" },
    };
  });

  // Agrupar por SKU y contar la cantidad vendida de cada diseño
  const designSales = {};

  groupedOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!designSales[item.sku]) {
        designSales[item.sku] = { ...item, quantity: 0 };
      }
      designSales[item.sku].quantity += item.quantity;
    });
  });

  // Ordenar por cantidad vendida y agregar al Excel
  const sortedDesigns = Object.values(designSales).sort(
    (a, b) => b.quantity - a.quantity
  );
  for (const design of sortedDesigns) {
    const row = designsSheet.addRow({
      sku: design.sku,
      product_name: design.product_name,
      quantity: design.quantity,
    });

    // Setear altura de la fila donde se coloca la imagen
    row.height = 100;

    // Descargar la imagen desde la URL y agregarla a la hoja
    const imageUrl = design.image_url;
    const imagePath = path.join(__dirname, `${design.sku}.jpg`);
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imagePath, response.data);

    const imageId = workbook.addImage({
      filename: imagePath,
      extension: "jpeg",
    });

    designsSheet.addImage(imageId, {
      tl: { col: 3, row: row.number - 1 }, // Posiciona la imagen
      ext: { width: 100, height: 100 },
    });
  }

  // Generar la fecha actual en el formato YYYY-MM-DD
  const currentDate = new Date();
  const outputDir = path.join(__dirname, "Blank_reports");

  // Asegurarse de que la carpeta Blank_reports existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Ruta del archivo de salida
  const outputFilePath = path.join(
    outputDir,
    `Order_Report_${format(currentDate, "yyyy-MM-dd")}.xlsx`
  );

  // Guardar el archivo Excel
  await workbook.xlsx.writeFile(outputFilePath);
  console.log("Excel file created successfully.");

  // Limpieza: Elimina las imágenes temporales después de generar el archivo
  sortedDesigns.forEach((design) => {
    const imagePath = path.join(__dirname, `${design.sku}.jpg`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  });

  return summaryData;
};

const sendMail = async () => {
  const [summaryData] = await getOrdersYesterdaySummaryModal();
  const generalSummary = getGeneralSummary(summaryData);
  const summaryBySite = getSummaryBySite(summaryData);

  // Construcción de la sección Summary
  let summaryHtml = `
  <tr>
    <td style="background-color: #B5B5B5;color: white;width: 20%;padding: 10px">${format(
      subDays(new Date(), 1),
      "EEEE, d / MMMM"
    )}</td>
    <td style="background-color: #ededed;color: black;text-align: center;">$${parseFloat(
      generalSummary.Revenue
    )}</td>
    <td style="background-color: #ededed;color: black;text-align: center;">${
      generalSummary.Orders
    }</td>
    <td style="background-color: #ededed;color: black;text-align: center;">${
      generalSummary.Units
    }</td>
    <td style="background-color: #ededed;color: black;text-align: center;">$${parseFloat(
      generalSummary.Average_Sale
    )}</td>
  </tr>
  `;

  // Construcción de la sección Stores
  let storesHtml = "";
  let isAlternate = false;
  for (const [store, summary] of Object.entries(summaryBySite)) {
    const bgColor = isAlternate ? "#FFFFFF" : "#ededed";
    storesHtml += `
      <tr>
        <td style="background-color: #B5B5B5;color: white;width: 20%;padding: 10px">${store}</td>
        <td style="background-color: ${bgColor};color: black;text-align: center;">$${parseFloat(
      summary.Revenue
    )}</td>
        <td style="background-color: ${bgColor};color: black;text-align: center;">${
      summary.Orders
    }</td>
        <td style="background-color: ${bgColor};color: black;text-align: center;">${
      summary.Units
    }</td>
        <td style="background-color: ${bgColor};color: black;text-align: center;">$${parseFloat(
      summary.Average_Sale
    )}</td>
      </tr>
    `;
    isAlternate = !isAlternate;
  }

  const currentDate = format(new Date(), "yyyy-MM-dd");
  const folderPath = path.join(__dirname, "..", "Utilities", "Blank_reports");

  const findFileByDate = () => {
    try {
      const files = fs.readdirSync(folderPath);
      const file = files.find((file) => file.includes(currentDate));

      if (file) {
        console.log(`Archivo encontrado: ${file}`);
        return path.join(folderPath, file); // Devolver la ruta completa del archivo
      } else {
        console.log(`No se encontró un archivo con la fecha ${currentDate}`);
        return null;
      }
    } catch (error) {
      console.error("Error al leer los archivos:", error);
    }
  };

  const filePath = findFileByDate();

  if (filePath) {
    const mailOptions = {
      from: "Automata Blanks <platforms@teeblox.com>", // Remitente
      to: [
        "yosuani@d2america.com",
        "frank@fjdinvestments.com",
        "luis@smartprintsink.com",
      ], // Múltiples destinatarios en 'to'
      subject: `Blanks Orders Report ${currentDate}`,
      html: report_template(summaryHtml, storesHtml),
      attachments: [
        {
          filename: `Order_Report_${currentDate}.xlsx`, // Archivo adjunto
          path: filePath, // Ruta del archivo
        },
      ],
    };

    try {
      // Enviar el correo
      const info = await transporter.sendMail(mailOptions);
      console.log("Correo enviado: " + info.response);
      return info;
    } catch (error) {
      console.error("Error al enviar el correo:", error);
    }
  } else {
    console.log("No se encontró un archivo con la fecha de hoy.");
  }
};

//---------------- Auxiliar --------------------------------

// Función para obtener el resumen general
const getGeneralSummary = (orders) => {
  const revenue = orders.reduce(
    (acc, order) => acc + parseFloat(order.total),
    0
  );
  const units = orders.reduce((acc, order) => acc + order.units, 0);
  const totalOrders = orders.length;
  const averageSale = revenue / totalOrders;

  return {
    Revenue: revenue.toFixed(2),
    Units: units,
    Orders: totalOrders,
    Average_Sale: averageSale.toFixed(2),
  };
};

const getSummaryBySite = (orders) => {
  const summaryBySite = {};

  orders.forEach((order) => {
    const siteName = order.site_name;

    if (!summaryBySite[siteName]) {
      summaryBySite[siteName] = {
        Revenue: 0,
        Units: 0,
        Orders: 0,
        Average_Sale: 0,
      };
    }

    summaryBySite[siteName].Revenue += parseFloat(order.total);
    summaryBySite[siteName].Units += order.units;
    summaryBySite[siteName].Orders += 1;
  });

  // Calcular Average Sale para cada tienda
  for (const site in summaryBySite) {
    const { Revenue, Orders } = summaryBySite[site];
    summaryBySite[site].Average_Sale = (Revenue / Orders).toFixed(2);
    summaryBySite[site].Revenue = Revenue.toFixed(2); // Formato decimal de Revenue
  }

  return summaryBySite;
};

module.exports = {
  processOrdersBlankWalmart,
  exportXlxs,
  sendMail,
};
