const db = require("../config/dbConfig").promise();

const getPtosListModel = () => {
    return db.query(`
        SELECT 
            p.pto AS pto,
            p.theme,
            p.date AS pto_date,
            p.designer AS designer,
            COUNT(DISTINCT m.design) AS designs,
            COUNT(DISTINCT m.color) AS colors
        FROM 
            ptos p
        LEFT JOIN 
            mockups m ON p.id = m.pto
        WHERE 
            p.status = 'listo'
        GROUP BY 
            p.pto, p.date, p.designer
        ORDER BY 
            p.date DESC;
        `);
}

const getPTOModel = (pto) => {
    return db.query(`
        SELECT 
	        p.path, p.design, m.classification, p.title, p.description, p.keywords,
	        te.estilo, tc.color
        FROM 
	        ptos p
        JOIN mockups m	ON p.id = m.pto
        JOIN testilo te ON m.product = te.codigo
        JOIN tcolor tc ON m.color = tc.pod_code
        WHERE
	        p.pto = ?
        GROUP BY
	        p.design, te.estilo, tc.color;
        `,[pto]);
}

const getColorsModel = () => {
    // return db.query(`
    //     SELECT DISTINCT color, pod_code
    //         FROM tcolor
    //     WHERE color IS NOT NULL
    //         AND color != ''
    //         AND pod_code IS NOT NULL
    //         AND pod_code != ''
    //     `);
    return db.query(`
        SELECT DISTINCT tc.color, tc.pod_code, tcu.url
            FROM tcolor tc LEFT JOIN tcolor_url tcu ON tcu.color = tc.color
        WHERE tc.color IS NOT NULL
            AND tc.color != ''
            AND tc.pod_code IS NOT NULL
            AND tc.pod_code != ''
        `);
}

const getMockupsModel = (pto) => {
    return db.query(`
        SELECT 
            m.parent_sku, m.path, m.design, m.classification, m.product, 
            m.color, m.location 
        FROM 
            mockups m 
        JOIN ptos p ON p.id = m.pto 
        WHERE 
            p.pto = ?
        `,[pto]);
}

const saveMockupDetailModel = (data) => {
    return db.query(`
        INSERT INTO 
            mockup_url_details 
            (parent_sku, brand, design, classification, product, sku, color, size, img1, img2, img3) 
        VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,[data.parent_sku, data.brand, data.design, data.classification, data.product,
            data.sku, data.color, data.size, data.img1, data.img2, data.img3]);
}

const getPriceRelationshipModel = (data) => { 
    return db.query(`
        SELECT 
            price AS final_price
        FROM (
            SELECT 
                lpp.price AS price, 
                1 AS priority
            FROM license_product_price lpp
            WHERE lpp.license = ? 
              AND lpp.product = ?
              AND lpp.color = ?
              AND lpp.size = ?
            UNION ALL
            SELECT 
                po.price AS price, 
                2 AS priority
            FROM product_offering po
            WHERE po.classification_code = ?
              AND po.product_code = ?
              AND po.color_code = ?
              AND po.size_code = ?
        ) AS combined
        ORDER BY priority
        LIMIT 1;
    `, [data.brand, data.product, data.color, data.size, data.classification, data.product, data.color, data.size]);
};

const updatePTOsModel = (pto, design, data) => {
    const fieldsToUpdate = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
  
    return db.query(
      `UPDATE ptos SET ${fieldsToUpdate} WHERE pto = ? AND design = ?`,
      [...Object.values(data), pto, design]
    );
  };

//Obtener el ultimo mpn registrado
const getLastMPNModel = () => {
    return db.query(`
        SELECT 
            mpn 
        FROM 
            mpn 
        ORDER BY id DESC 
        LIMIT 1;`);
}

//Registrar productos como MPN
const saveMPNModel = (data) => {
    return db.query(`
        INSERT INTO 
            mpn 
            (mpn, status, sku, pto) 
        VALUES 
            (?, ?, ?, ?)
        `, [data.mpn, data.status, data.sku, data.pto]);
};
//Crear una consulta que me devuelva el mpn segun el sku
const getMpnBySku = (sku) => {
    return db.query(`
        SELECT mpn 
        FROM mpn 
        WHERE sku = ?
        LIMIT 1;
    `, [sku]);
};

module.exports = {
    getPtosListModel,
    getPTOModel,
    getLastMPNModel,
    getMockupsModel,
    updatePTOsModel,
    getColorsModel,
    saveMockupDetailModel,
    saveMPNModel,
    getPriceRelationshipModel,
    getMpnBySku
}