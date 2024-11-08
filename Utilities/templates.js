const report_template = function (summaryHtml, storesHtml) {
    return `
      <html>
  <body>
    <h1 id="title" style="color: white;background-color: #B5B5B5;width: 75%; text-align: center">Blanks Sales Report Quick View</h1>
    <h3 style="color: white;background-color: #B5B5B5;width: 75%; text-align: center">Yesterday Summary</h3>
    <table style="border-collapse: separate;border-spacing: 0px;width: 75%;">
      <tr>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Yesterday</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Revenue</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Orders</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Units</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Average Sale</th>
      </tr>
      ${summaryHtml} <!-- Inserta los datos de resumen general aquí -->
    </table>

    <h3 style="color: white;background-color: #B5B5B5;width: 75%; text-align: center">Units Sold by Store</h3>
    <table style="border-collapse: separate;border-spacing: 0px;width: 75%;">
      <tr>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Store</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Revenue</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Orders</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Units</th>
        <th style="background-color: #FFFFFF;color: black;font-weight: bold;">Average Sale</th>
      </tr>
      ${storesHtml} <!-- Inserta los datos por tienda aquí -->
    </table>

    <h6 style="color: white;background-color: #B5B5B5;width: 75%; text-align: right">End of Report</h6>
  </body>
</html>
`
};

module.exports = {
    report_template,
}