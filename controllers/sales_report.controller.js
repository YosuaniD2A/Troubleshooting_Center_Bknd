const { 
    getStoresList, 
    getSalesReportSummary, 
    getSalesReportPeriod, 
    getSalesReportStores, 
    getSalesReportBrands, 
    getSalesReportShutterstockSplit, 
    getSalesReportByStore, 
    getSalesReportSummaryByMonths,
    getMarkList,
    getSalesReportByMark} = require("../models/sales_report.model");

const getStores = async (req, res) => {
    try {
        let storesNames = [];
        const [data] = await getStoresList();

        data.forEach((elem) => {
            storesNames.push(elem.site_name)
        })

        res.send({
            data: storesNames
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getMarks = async (req, res) => {
    try {
        let marksNames = [];
        const [data] = await getMarkList();

        data.forEach((elem) => {
            marksNames.push(elem.licensor)
        })

        res.send({
            data: marksNames
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesSumary = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;

        const [data] = await getSalesReportSummary(initialDate, finalDate)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesSumaryByMonths = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;

        const [data] = await getSalesReportSummaryByMonths(initialDate, finalDate)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesPeriod = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;

        const [data] = await getSalesReportPeriod(initialDate, finalDate)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesStores = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;

        const [data] = await getSalesReportStores(initialDate, finalDate)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesBrands = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;

        const [data] = await getSalesReportBrands(initialDate, finalDate)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesShutterstockSplit = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;

        const [data] = await getSalesReportShutterstockSplit(initialDate, finalDate)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesByStore = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;
        const store = req.body.store;

        const [data] = await getSalesReportByStore(initialDate, finalDate, store)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

const getSalesByMarks = async (req, res) => {
    try {
        const initialDate = req.body.initialDate;
        const finalDate = req.body.finalDate;
        const mark = req.body.mark;

        const [data] = await getSalesReportByMark(initialDate, finalDate, mark)

        res.send({
            data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}


module.exports = {
    getStores,
    getMarks,
    getSalesSumary,
    getSalesPeriod,
    getSalesStores,
    getSalesBrands,
    getSalesShutterstockSplit,
    getSalesByStore,
    getSalesSumaryByMonths,
    getSalesByMarks
};