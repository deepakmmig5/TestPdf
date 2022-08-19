import pdf from 'html-pdf'
// import handlebars from 'handlebars'
// import AWS from 'aws-sdk'
// import pc  from 'pdf-page-counter'
import { PDFDocument } from 'pdf-lib'
import fetch from 'node-fetch'

process.env.PATH = `${process.env.PATH}:/opt`
process.env.FONTCONFIG_PATH = '/opt'
process.env.LD_LIBRARY_PATH = '/opt'
var header_height='8cm';
var footer_height='3.5cm';
var pageDivider='<div class="divBreak">&nbsp;</div>';
export const htmlToPdf = async event => {
    try {
        var today = new Date();
        header_height = event.query.header;

        footer_height = event.query.footer;
        let html = event.body;
        const labReport=await PDFDocument.create();
            await Promise.all(html.split(pageDivider).map(async (x) => { 
            const file= await exportHtmlToPdf(x);// html to pdf
            const pdfDoc = await PDFDocument.load(Buffer.from(file)); // loading generated pdf in pdfDoc
            const allPages = await labReport.copyPages(pdfDoc, pdfDoc.getPageIndices()); // getting all pages
            return allPages;
        })).then(responses => {
            responses.map(response => response.forEach((page) => labReport.addPage(page)));
          });
        

        //   var diffMs = (new Date() - today); 
        //   //var diffSec = Math.round(((diffMs % 86400000) % 3600000) / 60000); 
        //   const pages = labReport.getPages()
        //   pages[0].drawText('Time elapsed: '+diffMs)
        
        try{
         const jpgUrl = 'https://lims.redcliffelabs.com/redcliffelabs/App_Images/ReportBackGround/ReportLetterHead_466.jpg';
         const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer());
         const jpgImage = await labReport.embedJpg(jpgImageBytes)
         //const jpgDims = jpgImage.scale(0.5)
         const pages = labReport.getPages()
         pages[0].drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: pages[0].width,
            height: pages[0].height,
            opacity: 0.75,
          });}catch(err){console.log(err)}

const pdfBytes = await labReport.saveAsBase64()

     
     let response = {

      statusCode: 200,
      headers: {
        'Content-type': 'application/pdf',//you can change any content type
        'content-disposition': 'attachment; filename=test.pdf' // key of success
      },
      body: pdfBytes,
      //header:event.query.header,
      //footer:event.query.footer,
      //att:att,
      isBase64Encoded: true
    };
    return response;
		
		
      
    } catch (error) {
        return error
    }
}



/**
 * 
 * @param {string} html 
 * takes html string as input and convert it into Buffer
 */
const exportHtmlToPdf = html => {
    return new Promise((resolve, reject) => {
        pdf.create(html, {
            format: "A4",
            orientation: "portrait",
			fitToPage: true,
			localUrlAccess: true,
			  paginationOffset: 1,       // Override the initial pagination number
			header: {
    height: header_height,
    
    
  },
  footer: {
    height: footer_height
  }
			
			
			
            // This is the path for compiled phantomjs executable stored in layer.
            // To test locally comment out the following line.
            //  ,phantomPath: '/opt/phantomjs_linux-x86_64'
        }).toBuffer((err, buffer) => {
            if (err) {
                reject(err)
            } else {
                resolve(buffer)
            }
        });
    })
}
