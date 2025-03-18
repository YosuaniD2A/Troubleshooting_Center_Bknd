const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require("cors");
const cron = require('node-cron'); 

const indexRouter = require('./routes/index');
const shutterstockRouter = require('./routes/shutterstock');
const creaTuPlayera = require('./routes/crea_tu_playera');
const brokedImageRouter = require('./routes/broked_image');
const scalablepressRouter = require('./routes/scalablepress');
const salesReportRouter = require('./routes/sales_report');
const shippingAddressRouter = require('./routes/shipping_address');
const swiftpod = require('./routes/swiftpod');
const thePrintBar = require('./routes/the_print_bar');
const imageDownloader = require('./routes/image_downloader');
const dropbox = require('./routes/dropbox');
const aws = require('./routes/aws');
const mercadolibreAuth = require('./routes/mercadolibreAuth');
const blanks = require('./routes/blanks');
const coppel = require('./routes/coppel');
const listingGenerator = require('./routes/listing_generator');
const mockupGenerator = require('./routes/mockup_generator');
const infoGenerator = require('./routes/ai_generator');
const { autoLicenseImageToReport } = require('./controllers/shutterstock.controller');
const { processOrdersBlankWalmart, exportXlxs, sendMail } = require('./Utilities/blanks');
const { fetchShippingOrders, saveCoppelOrders } = require('./Utilities/coppel.utilities');

require('dotenv').config();

const app = express();
const imagesPath = 'C:/Users/loren/go/src/ptos';

app.use(cors({
  origin: '*' // O establece tu dominio específico, por ejemplo: 'http://localhost:4200'
}));
// app.use(cors({
//   credentials: true,
//   origin:['http://192.168.5.194:8080', 'http://192.168.5.194:8080/']
// }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Aumenta el límite a 50MB, por ejemplo
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(imagesPath));

app.use('/', indexRouter);
app.use('/shutterstock', shutterstockRouter);
app.use('/crea_tu_playera', creaTuPlayera);
app.use('/broked_image', brokedImageRouter);
app.use('/scalablepress', scalablepressRouter);
app.use('/sales_report', salesReportRouter);
app.use('/shipping_address', shippingAddressRouter);
app.use('/swiftpod', swiftpod);
app.use('/the_print_bar', thePrintBar);
app.use('/dropbox', dropbox);
app.use('/aws', aws);
app.use('/imageDownloader', imageDownloader);
app.use('/mercadolibreAuth', mercadolibreAuth);
app.use('/blanks', blanks);
app.use('/coppel', coppel);
app.use('/listingGenerator', listingGenerator);
app.use('/mockupGenerator', mockupGenerator);
app.use('/infoGenerator', infoGenerator);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Programa la tarea diaria a las 10 am
// cron.schedule('0 10 * * *', () => {
//   // autoLicenseImageToReport();
//   const date = new Date();
//   console.log(`Reporte de Shutterstock ejecutado a las: ${date}`);

// });

//------------------------ Tareas Programadas para ejecucion automatica ---------------------
// cargar ordenes de Blanks cada 15 min
cron.schedule('*/15 * * * *', async () => {
  try {
    const result = await processOrdersBlankWalmart();
    console.log("Tarea Upload Blanks Orders ejecutada automáticamente:\n", result);
  } catch (error) {
    console.error("Error en la tarea automática Upload Blanks Orders:\n", error.message);
  }
});
// Exportar el Reporte de Blanks todos los dias a las 7 am
cron.schedule('0 7 * * *', async () => {
  try {
    const result = await exportXlxs();
    console.log("Tarea Export XLXS ejecutada automáticamente:\n", result);
  } catch (error) {
    console.error("Error en la tarea automática Export XLXS:\n", error.message);
  }
});
// Enviar el Reporte de Blanks todos los dias a las 7:30 am
cron.schedule('30 7 * * *', async () => {
  try {
    const result = await sendMail();
    console.log("Tarea Send Mail ejecutada automáticamente:\n", result);
  } catch (error) {
    console.error("Error en la tarea automática Send Mail:\n", error.message);
  }
});
//Iniciando tarea programada para procesar órdenes de Coppel...
cron.schedule("*/15 * * * *", async () => {
  try {
    const shippingOrders = await fetchShippingOrders();

    if (
      !shippingOrders ||
      !shippingOrders.orders ||
      shippingOrders.orders.length === 0
    ) {
      console.log("No se encontraron órdenes para procesar.");
      return;
    }

    const saveResult = await saveCoppelOrders(shippingOrders);

    if (!saveResult.success) {
      console.error(
        "Error al guardar órdenes:",
        saveResult.message,
        saveResult.errors || ""
      );
      return;
    }

    console.log("Tarea Ordenes Coppel ejecutada automáticamente.", shippingOrders);
  } catch (error) {
    console.error("Error en la tarea automática Ordenes Coppel:\n", error.message);
  }
});

module.exports = app;
