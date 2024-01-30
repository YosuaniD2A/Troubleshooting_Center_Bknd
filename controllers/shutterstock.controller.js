const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const { importCsv, factoryShutterstock, insertDB, saveImages, get30DaysAgoDate, insertDBReport } = require("../Utilities/shutterstock.utilities");
const { getOrdersWithShutterId, getReportSendToday } = require("../models/shutterstock.model");

// Funcion que devuelve toda la informacion de las imagenes que se cargan del CSV
const uploadCSV = async (req, res) => {
    try {
        let listErrorsIDs = [];
        const imageType = req.body.imageType
        const filePath = req.file.path;
        const listOfIds = await importCsv(
            fs.createReadStream(filePath).pipe(csv()));

        console.log(imageType)
        const imageMetadataPromises = await Promise.all(listOfIds.map(async (elem) => {
            const getInfoOfImage = await factoryShutterstock(
                process.env.SHUTTERSTOCK_INGESTION_COMMERCIAL_AND_EDITORIAL_TOKEN
            ).getImageDataWithCredentials(elem.shutterstock_id, imageType);
            console.log(getInfoOfImage)
            if (getInfoOfImage === 'undefined' || getInfoOfImage.error || getInfoOfImage.errors) {
                console.log(`Error con el ID ${elem.shutterstock_id}`);
                listErrorsIDs.push({ id: elem.shutterstock_id });
                return null
            }
            else {
                return {
                    shutterstock_id: getInfoOfImage.id,
                    description: getInfoOfImage.description,
                    categories: getInfoOfImage.categories
                        .map((obj) => obj.name)
                        .join(","),
                    keywords: getInfoOfImage.keywords.toString(),
                    displayname: imageType === "Commercial" ? getInfoOfImage.assets.huge_jpg.display_name : getInfoOfImage.assets.original.display_name,
                    is_licensable: imageType === "Commercial" ? getInfoOfImage.assets.huge_jpg.is_licensable : getInfoOfImage.assets.original.is_licensable,
                    requested_date: new Date(),
                    filename: imageType === "Commercial" ? getInfoOfImage.original_filename : getInfoOfImage.title,
                    license_id: "",
                    contributor: imageType === "Commercial" ? getInfoOfImage.contributor.id : undefined,
                    is_adult: imageType === "Commercial" ? getInfoOfImage.is_adult : undefined,
                    file_size: imageType === "Commercial" ? getInfoOfImage.assets.huge_jpg.file_size : undefined,
                    format: imageType === "Commercial" ? getInfoOfImage.assets.huge_jpg.format : undefined,
                };
            }
        }));

        res.send({
            imageType,
            data: imageMetadataPromises,
            listErrorsIDs
        });

    } catch (error) {
        res.status(500).json({
            msg: error.message
        });
    }
};

// Funcion que guarda en la BD la metadata que se genera en la funcion uploadCSV()
const saveOnlyMetadata = async (req, res) => {
    const imageType = req.body.imageType;
    const data = req.body.data;

    const result = await Promise.all(data.map(async (image) => {
        return await insertDB(image, imageType);
    }))

    res.send({
        imageType,
        data: result
    });
}

// Funcion que licencia las imagenes para descargarlas
const downloadAndSave = async (req, res) => {
    const imageType = req.body.imageType;
    const data = req.body.data;

    const licenses = await Promise.all(data.map(async (image) => {
        if (image !== null) {
            const result = await insertDB(image, imageType);
            if (!result.includes('existe')) {
                return await factoryShutterstock(process.env.SHUTTERSTOCK_INGESTION_COMMERCIAL_AND_EDITORIAL_TOKEN)
                    .licenseImageToDownload(image.shutterstock_id, imageType);
            } else {
                return 'Archivo no descargado porque ya existe';
            }
        } else {
            return null;
        }
    }));

    const result = await Promise.all(licenses.map(async (elem) => {
        if (elem !== null) {
            if (typeof elem === 'string') {
                return elem;
            } else {
                return await saveImages(elem.data[0].download);
            }
        }
        return null;
    }));

    res.send({
        path: 'C:/Users/yborg/OneDrive/Documents/Proyectos activos/Dashboard D2America/Troubleshooting_bknd/download/',
        imageType,
        result,
    });
}

// Funcion para licenciar imagenes para reporte de ventas
const licenseImageToReport = async (req, res) => {
    try {
        const date = get30DaysAgoDate();
        let listofAvailables = [];

        const [ordersData] = await getOrdersWithShutterId(date);

        if (ordersData) {
            const availables = await Promise.all(ordersData.map(async (order) => {
                // Validacion para que solo compruebe las imagenes comerciales (ID de solo numeros)
                if (/[a-zA-Z]/.test(order.shutterstock_id) === false) {
                    const result = await factoryShutterstock(process.env.SHUTTERSTOCK_INGESTION_COMMERCIAL_AND_EDITORIAL_TOKEN)
                        .isAvailableToLicense(order.shutterstock_id);

                    if (result.data.length !== 0)
                        listofAvailables.push(order)
                } else {
                    listofAvailables.push(order);
                }

                return;
            }))

        }

        // Esta seccion de codigo es la encargada de realizar el licenciamiento de las ordenes
        const listofLicensedImages = await Promise.all(listofAvailables.map(async (order) => {
            const result = await factoryShutterstock().licenseImageToReport(order);

            if (result.errors) {
                return {
                    shutterstock_id: order.shutterstock_id,
                    order_date: order.order_date,
                    license_account: (/[a-zA-Z]/.test(order.shutterstock_id)) ? 'd2apiplatformretailliveeditorial' : 'd2apiplatformretaillive',
                    price: 0.00,
                    revsahre: 0.00,
                    license: result.data[0].error,
                    licensed_time: new Date().toISOString()
                };
            }
            else {
                if (result.data) {
                    return {
                        shutterstock_id: order.shutterstock_id,
                        order_date: order.order_date,
                        license_account: (/[a-zA-Z]/.test(order.shutterstock_id)) ? 'd2apiplatformretailliveeditorial' : 'd2apiplatformretaillive',
                        price: order.unit_price,
                        revsahre: parseFloat((order.unit_price * 0.16).toFixed(2)),
                        license: result.data[0].license_id,
                        licensed_time: new Date().toISOString()
                    };
                } else {
                    return {
                        shutterstock_id: order.shutterstock_id,
                        order_date: order.order_date,
                        license_account: (/[a-zA-Z]/.test(order.shutterstock_id)) ? 'd2apiplatformretailliveeditorial' : 'd2apiplatformretaillive',
                        price: 0.00,
                        revsahre: 0.00,
                        license: result.message,
                        licensed_time: new Date().toISOString()
                    };
                }
            }
        }));

        // Esta seccion es la encargada de registrar las licencias en la tabla Shutterstock_license_report
        const report = await Promise.all(listofLicensedImages.map(async (order) => {
            const { status } = await insertDBReport(order);
            return { ...order, status };
        }));

        // Esta seccion es la encargada de crear un registro fisico (CSV) del reporte
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filename = `licenses_report_${timestamp}.csv`;
        const csvWriter = createCsvWriter({
            path: `Shutterstock_Reports/${filename}`,
            header: [
                { id: 'shutterstock_id', title: 'Shutterstock ID' },
                { id: 'order_date', title: 'Order date' },
                { id: 'license_account', title: 'Account' },
                { id: 'price', title: 'Price' },
                { id: 'revsahre', title: 'Shutterstock 16 percent' },
                { id: 'license', title: 'License' },
                { id: 'licensed_time', title: 'Licensed time' },
                { id: 'status', title: 'Status on DB' }
            ]
        });

        await csvWriter.writeRecords(report);

        res.send(report);

    } catch (error) {
        res.send({ error: error.message });
        console.log(error);
    }
}

// Misma funcion pero ajustada para ejecutarse automaticamente
const autoLicenseImageToReport = async () => {
    try {
        const date = get30DaysAgoDate();
        let listofAvailables = [];

        const [ordersData] = await getOrdersWithShutterId(date);

        if (ordersData) {
            const availables = await Promise.all(ordersData.map(async (order) => {
                // Validacion para que solo compruebe las imagenes comerciales (ID de solo numeros)
                if (/[a-zA-Z]/.test(order.shutterstock_id) === false) {
                    const result = await factoryShutterstock(process.env.SHUTTERSTOCK_INGESTION_COMMERCIAL_AND_EDITORIAL_TOKEN)
                        .isAvailableToLicense(order.shutterstock_id);

                    if (result.data.length !== 0)
                        listofAvailables.push(order)
                } else {
                    listofAvailables.push(order);
                }

                return;
            }))

        }

        // Esta seccion de codigo es la encargada de realizar el licenciamiento de las ordenes
        const listofLicensedImages = await Promise.all(listofAvailables.map(async (order) => {
            const result = await factoryShutterstock().licenseImageToReport(order);

            if (result.errors) {
                return {
                    shutterstock_id: order.shutterstock_id,
                    order_date: order.order_date,
                    license_account: (/[a-zA-Z]/.test(order.shutterstock_id)) ? 'd2apiplatformretailliveeditorial' : 'd2apiplatformretaillive',
                    price: 0.00,
                    revsahre: 0.00,
                    license: result.data[0].error,
                    licensed_time: new Date().toISOString()
                };
            }
            else {
                if (result.data) {
                    return {
                        shutterstock_id: order.shutterstock_id,
                        order_date: order.order_date,
                        license_account: (/[a-zA-Z]/.test(order.shutterstock_id)) ? 'd2apiplatformretailliveeditorial' : 'd2apiplatformretaillive',
                        price: order.unit_price,
                        revsahre: parseFloat((order.unit_price * 0.16).toFixed(2)),
                        license: result.data[0].license_id,
                        licensed_time: new Date().toISOString()
                    };
                } else {
                    return {
                        shutterstock_id: order.shutterstock_id,
                        order_date: order.order_date,
                        license_account: (/[a-zA-Z]/.test(order.shutterstock_id)) ? 'd2apiplatformretailliveeditorial' : 'd2apiplatformretaillive',
                        price: 0.00,
                        revsahre: 0.00,
                        license: result.message,
                        licensed_time: new Date().toISOString()
                    };
                }
            }
        }));

        // Esta seccion es la encargada de registrar las licencias en la tabla Shutterstock_license_report
        const report = await Promise.all(listofLicensedImages.map(async (order) => {
            const { status } = await insertDBReport(order);
            return { ...order, status };
        }));

        // Esta seccion es la encargada de crear un registro fisico (CSV) del reporte
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const filename = `licenses_report_${timestamp}.csv`;
        const csvWriter = createCsvWriter({
            path: `Shutterstock_Reports/${filename}`,
            header: [
                { id: 'shutterstock_id', title: 'Shutterstock ID' },
                { id: 'order_date', title: 'Order date' },
                { id: 'license_account', title: 'Account' },
                { id: 'price', title: 'Price' },
                { id: 'revsahre', title: 'Shutterstock 16 percent' },
                { id: 'license', title: 'License' },
                { id: 'licensed_time', title: 'Licensed time' },
                { id: 'status', title: 'Status on DB' }
            ]
        });

        await csvWriter.writeRecords(report);

    } catch (error) {
        console.log(error);
    }
}

const reportsToday = async (req, res) => {
    try {
        const date  = req.body.date;
        const [report] =  await getReportSendToday(date)

        res.send(report);
        
    } catch (error) {
        res.send({ error: error.message });
        console.log(error);
    }
}

module.exports = {
    uploadCSV,
    saveOnlyMetadata,
    downloadAndSave,
    licenseImageToReport,
    autoLicenseImageToReport,
    reportsToday
};