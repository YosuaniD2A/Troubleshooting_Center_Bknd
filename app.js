const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
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
const { autoLicenseImageToReport } = require('./controllers/shutterstock.controller');

require('dotenv').config();

const app = express();

app.use(cors());
// app.use(cors({
//   credentials: true,
//   origin:['http://192.168.5.194:8080', 'http://192.168.5.194:8080/']
// }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/imageDownloader', imageDownloader);

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

module.exports = app;
