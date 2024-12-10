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


module.exports = {
    getPtosListModel,
    getPTOModel,
    getMockupsModel
}