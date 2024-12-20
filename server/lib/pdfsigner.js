var fs = require('fs');
var path = require('path');
var plainAddPlaceholder = require('@signpdf/placeholder-plain').plainAddPlaceholder
var signpdf = require('@signpdf/signpdf').default;
var P12Signer = require('./P12Signer').P12Signer;
var { PDFDocument, rgb } = require('pdf-lib');

async function signPdf(pdfBuffer, certificateBuffer, password, info, signatures) {
    var signer = new P12Signer(certificateBuffer, password);

    var rect = [50, 50, 200, 50];
    if (signatures.length > 0) {
        rect = [
            +signatures[0].x,
            +signatures[0].y,
            +signatures[0].width,
            +signatures[0].height
        ].map((v, i) => v * 72 / 96);
    }

    // The PDF needs to have a placeholder for a signature to be signed.
    var pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer: pdfBuffer,
        reason: info.reason,
        contactInfo: info.contactInfo,
        name: info.name,
        location: info.location,
        widgetRect: rect
    });

    // pdfWithPlaceholder is now a modified buffer that is ready to be signed.
    pdfBuffer = await signpdf.sign(pdfWithPlaceholder, signer);
    withRectangle = await drawRects(pdfBuffer, signatures, info.name);
    return withRectangle;
}

async function drawRects(pdfBuffer, signatures, name) {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()

    const textSize = 10;
    const date = `${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`

    for (let sign of signatures) {
        const page = pages[+sign.page-1];

        const w = page.getWidth(), h = page.getHeight();
        const rect = [
            sign.x * w,
            sign.y * h,
            sign.width * w,
            sign.height * h
        ];

        page.drawRectangle({
            x: rect[0],
            y: rect[1],
            width: rect[2],
            height: rect[3],

            borderWidth: 1,
            borderColor: rgb(13/255,110/255,253/255),
            color: rgb(128/255,128/255,128/255),
        });

        page.drawText(`Signed by ${name} \nat ${date}`, {
            x: rect[0] + (textSize / 2),
            y: (rect[1] + rect[3]) - textSize,
            size: textSize,
            lineHeight: textSize * 1.2,
            font: await pdfDoc.embedFont('Helvetica'),
            color: rgb(255/255, 110/255, 253/255),
        });
    }

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes, 'binary');
}

function verifyPdf(pdfBuffer) {
    // 
}

module.exports = { signPdf, verifyPdf };