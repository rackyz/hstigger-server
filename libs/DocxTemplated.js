const fs = require('fs')
const JSZip = require('jszip')
const Docxtemplater = require('docxtemplater')
const DIInspect = require('docxtemplater/js/inspect-module')
const ImageModule = require('open-docxtemplater-image-module')
const path = require('path')
const debug = require('debug')("DT:")
const ExportDOCXFromArray = (data_tables,templateName,outputName = 'test.docx', imageDirectory = '../static') => {

    //读取模板文件
    var content = fs.readFileSync(path.join(__dirname, `../static/tables/${templateName}`), 'binary')
    var zip = new JSZip(content)
    var doc = new Docxtemplater()
    var opts = {
        centered: false,
        getImage: function (tagValue, tagName) {
            console.log(__dirname);
            return fs.readFileSync(path.join(__dirname, '../static/' + tagValue));
        },
        getSize: function (img, tagValue, tagName) {
            return [150, 150];
        }
    }
    doc.setOptions({
        linebreaks: true
    })
    doc.attachModule(new ImageModule(opts))
    doc.loadZip(zip);
    let params= {}
    if(!data_tables)
        return
    data_tables.forEach((v, i) => {
        params['a'+i] = ((!v && typeof v != 'number') || v == 'undefined')? " ":v
    })

    doc.setData(params);

    try {
        /*
         render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        */
        doc.render();
    } catch (error) {
        var err = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify(err));
        /* 
        The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        */
        throw error;
    }

    var buf = doc.getZip().generate({
        type: 'nodebuffer'
    });
    /* buf is a nodejs buffer, you can either write it to a file or do anything else with it.*/
    fs.writeFileSync(path.join(__dirname, `../static/${outputName}`), buf);
    return path.join(__dirname, `../static/${outputName}`)
}


const ExportDOCX = (params, templateName, outputName = 'test.docx', imageDirectory = '../static') => {

    //读取模板文件
    var content = fs.readFileSync(path.join(__dirname, `../static/tables/${templateName}`), 'binary');
    var zip = new JSZip(content);
    var doc = new Docxtemplater();
    var opts = {
        centered: false,
        getImage: function (tagValue, tagName) {
            console.log(__dirname);
            return fs.readFileSync(path.join(__dirname, '../static/' + tagValue));
        },
        getSize: function (img, tagValue, tagName) {
            return [150, 150];
        }
    }
    doc.setOptions({
        linebreaks: true
    })
    doc.attachModule(new ImageModule(opts))
    doc.loadZip(zip);
    doc.setData(params);

    try {
        /*
         render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        */
        doc.render();
    } catch (error) {
        var err = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify(err));
        /* 
        The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        */
        throw error;
    }

    var buf = doc.getZip().generate({
        type: 'nodebuffer'
    });
    /* buf is a nodejs buffer, you can either write it to a file or do anything else with it.*/
    fs.writeFileSync(path.join(__dirname, `../static/${outputName}`), buf);
    return path.join(__dirname, `../static/${outputName}`)
}

const getDOCXTempl = (templateName) => {
     var content = fs.readFileSync(path.join(__dirname, `../static/tables/${templateName}`), 'binary');


     var zip = new JSZip(content);
     var doc = new Docxtemplater()
     let inspecter = new DIInspect()
     doc.attachModule(inspecter)
     doc.loadZip(zip);
     doc.render()
     var tags = inspecter.getAllTags()
     return tags
}

const getDOCX = (params, templateName, imageDirectory = '../static') => {

    //读取模板文件
    var content = fs.readFileSync(path.join(__dirname, `../static/tables/${templateName}`),'binary');
    return content
    var zip = new JSZip(content);
    var doc = new Docxtemplater();
    
    var opts = {
        centered: false,
        getImage: function (tagValue, tagName) {
            console.log(__dirname);
            return fs.readFileSync(path.join(__dirname, '../static/' + tagValue));
        },
        getSize: function (img, tagValue, tagName) {
            return [150, 150];
        }
    }
    doc.setOptions({
        paragraphLoop: true,
        linebreaks: true
    })
    doc.attachModule(new ImageModule(opts))
    doc.loadZip(zip);
    doc.setData(params);

    try {
        /*
         render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        */
        doc.render();
    } catch (error) {
        var err = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        /* 
        The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        */
        throw error;
    }

    var buf = doc.getZip().generate({
        type: 'array'
    });

    return buf
}

module.exports = {
    ExportDOCXFromArray,
    ExportDOCX,
    getDOCX,
    getDOCXTempl
}
