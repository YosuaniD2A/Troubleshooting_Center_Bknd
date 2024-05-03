const db = require("../config/dbConfig").promise();

const getStoresList = () => {
    return db.query('SELECT o.site_name, count(*) FROM orders as o Group by o.site_name ')
}

const getMarkList = () => {
    return db.query('SELECT bd.licensor FROM brand_dictionary bd WHERE bd.active = 1 GROUP BY bd.licensor')
}

const getSalesReportSummary = (initialDate, finalDate) => {
    return db.query(
        `SELECT
            'summary' AS summary,
             round(sum(revenue),2) revenue,
            sum(orders) orders,
            sum(units) items
        FROM (
            SELECT
                store,
                sum(revenue) revenue,
                count(*) orders,
                sum(units) units
            FROM (
                SELECT
                    site_name AS store,
                    order_id,
                    count(*) orders,
                    sum(quantity) units,
                    sum(proportional) revenue
                FROM
                    orders o
                WHERE
                order_date BETWEEN ? 
                    AND ?
                    AND (site_name != 'Shopify Pos'
                    AND site_name NOT LIKE '%Subscription%')
                    AND proportional > 0
                    AND o.shipping_status not in('cancelled', 'refunded')
                    AND sku NOT LIKE 'CL%'
                    AND site_order_id NOT LIKE 'VPO%'
                    AND length(sku) > 7
                GROUP BY
                    site_order_id) temp_orders
            GROUP BY
                store) summary;`,
        [initialDate, finalDate])
}

const getSalesReportSummaryByMonths = (initialDate, finalDate) => {
    return db.query(
        `SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS month,
        round(sum(revenue), 2) as revenue,
        count(*) as orders,
        sum(units) as items
    FROM (
        SELECT
            site_name AS store,
            order_id,
            count(*) as orders,
            sum(quantity) as units,
            sum(proportional) as revenue,
            order_date
        FROM
            orders o
        WHERE
            order_date BETWEEN ? 
            AND ?
            AND (site_name != 'Shopify Pos'
            AND site_name NOT LIKE '%Subscription%')
            AND proportional > 0
            AND o.shipping_status not in('cancelled', 'refunded')
            AND sku NOT LIKE 'CL%'
            AND site_order_id NOT LIKE 'VPO%'
            AND length(sku) > 7
        GROUP BY
            site_order_id) temp_orders
    GROUP BY 
        DATE_FORMAT(order_date, '%Y-%m')`,
        [initialDate, finalDate])
}

const getSalesReportPeriod = (initialDate, finalDate) => {
    return db.query(
        `SELECT
            concat(dayname(order_date), ' ,', day(order_date)) summary,
            round(sum(revenue),2) revenue,
            count(*) orders,
            sum(units) items
        FROM (
            SELECT
                date(order_date) AS order_date,
                order_id,
                count(*) orders,
                sum(quantity) units,
                sum(proportional) revenue
            FROM
                orders o
            WHERE
                order_date BETWEEN ?
                AND ?
                AND (site_name != 'Shopify Pos'
                AND site_name NOT LIKE '%Subscription%')
                AND proportional > 0
                AND o.shipping_status not in('cancelled', 'refunded')
                AND sku NOT LIKE 'CL%'
                AND site_order_id NOT LIKE 'VPO%'
                AND length(sku) > 7
            GROUP BY
                site_order_id,
                date(order_date)) days
        GROUP BY
            order_date;`,
        [initialDate, finalDate])
}

const getSalesReportStores = (initialDate, finalDate) => {
    return db.query(
        `SELECT
            store AS summary,
            round(sum(revenue),2) revenue,
            count(*) orders,
            sum(units) items
        FROM (
            SELECT
                site_name AS store,
                order_id,
                count(*) orders,
                sum(quantity) units,
                sum(proportional) revenue
            FROM
                orders o
            WHERE
                order_date BETWEEN ?
                AND ?
                AND (site_name != 'Shopify Pos'
                AND site_name NOT LIKE '%Subscription%')
                AND proportional > 0
                AND o.shipping_status not in('cancelled', 'refunded')
                AND sku NOT LIKE 'CL%'
                AND site_order_id NOT LIKE 'VPO%'
                AND length(sku) > 7
            GROUP BY
                site_order_id) temp_orders
        GROUP BY
            store
        ORDER BY
            sum(units)
            DESC;`,
        [initialDate, finalDate])
}

const getSalesReportBrands = (initialDate, finalDate) => {
    return db.query(
        `SELECT
            sku_type (sku) AS summary,
            round(sum(proportional),2) revenue,
            '0' AS orders,
            sum(quantity) items
        FROM
            orders o
        WHERE
            order_date BETWEEN ?
            AND ?
            AND (site_name != 'Shopify Pos'
            AND site_name NOT LIKE '%Subscription%')
            AND proportional > 0
            AND o.shipping_status not in('cancelled', 'refunded')
            AND sku NOT LIKE 'CL%'
            AND site_order_id NOT LIKE 'VPO%'
            AND length(sku) > 7
        GROUP BY
            sku_type (sku)
        ORDER BY
            sum(proportional)
            DESC;`,
        [initialDate, finalDate])
}

const getSalesReportShutterstockSplit = (initialDate, finalDate) => {
    return db.query(
        `SELECT 
        e.id_sstk as licenses, sum(e.quantity) as quantity, round(sum(e.proportional),2) revenue 
        FROM (
            SELECT
                o.order_date,
                o.site_name,
                o.sku,
                o.proportional,
                o.quantity,
                if (ifnull((select p.image_id from ptos p where p.design = SUBSTRING(o.sku, 1, 10) limit 1),
                (SELECT    
                    shutterstock_id 
                FROM 
                    ptos_inventory p 
                WHERE 
                    p.sku = SUBSTRING(o.sku,1,15) limit 1)) REGEXP '[a-z]$',
                'editorial',
                'commercial') id_sstk
            FROM
                orders o
            WHERE
                o.order_date BETWEEN ?
                AND ?
                AND o.proportional > 0
                AND o.shipping_status not in('cancelled', 'refunded')
                AND o.sku like 'SS%') e 
            GROUP BY e.id_sstk with ROLLUP;`,
        [initialDate, finalDate])
}

const getSalesReportByStore = (initialDate, finalDate, store) => {
    return db.query(
        `SELECT
            o.sku,
            o.title,
            o.shipping_country as 'territory',
            o.site_name as 'platform',
            o.order_date,
            round(o.unit_price,2) unit_price,
            o.quantity,
            round((o.quantity*o.unit_price),2) total_sales,
            .2 as 'royalty_rate',
            round(o.unit_price * .2,2) as 'total_royalties'
        FROM
            orders o
        WHERE
            o.order_date BETWEEN ? AND ? AND 
            o.proportional > 0 AND 
            o.shipping_status not in('cancelled', 'refunded') AND
            o.site_name = ?
        ORDER BY
            o.order_date`,
        [initialDate, finalDate, store])
}

const getSalesReportByMark = (initialDate, finalDate, mark) => {
    if(mark === 'Shutterstock'){
        return db.query(
            `SELECT
            o.sku,
            o.title,
            o.shipping_country as 'territory',
            o.site_name as 'platform',
            o.order_date,
            sm.shutterstock_id,
            sm.license_id as 'shutterstock license',
            round(o.unit_price,2) unit_price,
            o.quantity,
            round((o.quantity*o.unit_price),2) total_sales,
            b.royalties_percent as 'royalty_rate',
            round(o.unit_price * b.royalties_percent,2) as 'total_royalties'
        FROM
            orders o join
            brand_dictionary b on substr(o.sku, 1, 2) = b.literals join
            shutterstock_metadata sm on cast(substr(o.sku, 3, 8) as signed) = sm.id
        WHERE
            o.order_date BETWEEN ? AND ? AND 
            o.proportional > 0 AND 
            o.shipping_status not in('cancelled', 'refunded') AND
            b.licensor = ? AND
            b.active = 1
        ORDER BY
            o.order_date;`,
            [initialDate, finalDate, mark]
        );
    }else{
        return db.query(
            `SELECT
            o.sku,
            o.title,
            o.shipping_country as 'territory',
            o.site_name as 'platform',
            o.order_date,
            round(o.unit_price,2) unit_price,
            o.quantity,
            round((o.quantity*o.unit_price),2) total_sales,
            b.royalties_percent as 'royalty_rate',
            round(o.unit_price * b.royalties_percent,2) as 'total_royalties'
        FROM
            orders o join
            brand_dictionary b on substr(o.sku, 1, 2) = b.literals
        WHERE
            o.order_date BETWEEN ? AND ? AND 
            o.proportional > 0 AND 
            o.shipping_status not in('cancelled', 'refunded') AND
            b.licensor = ? AND
            b.active = 1
        ORDER BY
            o.order_date;`,
            [initialDate, finalDate, mark]
        );
    }
}

module.exports = {
    getStoresList,
    getMarkList,
    getSalesReportSummary,
    getSalesReportSummaryByMonths,
    getSalesReportPeriod,
    getSalesReportStores,
    getSalesReportBrands,
    getSalesReportShutterstockSplit,
    getSalesReportByStore,
    getSalesReportByMark
}