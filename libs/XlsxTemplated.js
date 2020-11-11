const fs = require('fs')
var XlsxTemplate = require('xlsx-template');
const path = require('path')




const ExportXlsxFromObject = (data_object,templateName,outputName = 'test_x.xlsx') => {

    //读取模板文件
    var content = fs.readFileSync(path.join(__dirname, `../static/tables/${templateName}`), 'binary');
     // Create a template
     var template = new XlsxTemplate(content);

     // Replacements take place on first sheet
     var sheetNumber = 1;
    template.substitute(sheetNumber, data_object);
    var buf = template.generate({
         type: 'nodebuffer'
    });
    /* buf is a nodejs buffer, you can either write it to a file or do anything else with it.*/
    fs.writeFileSync(path.join(__dirname, `../static/${outputName}`), buf);
    return path.join(__dirname, `../static/${outputName}`)
}

module.exports = {
    ExportXlsxFromObject
}
