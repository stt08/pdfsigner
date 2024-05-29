var fs = require('fs');
var path = require('path');
var plainAddPlaceholder = require('@signpdf/placeholder-plain').plainAddPlaceholder
var signpdf = require('@signpdf/signpdf').default;
var P12Signer = require('./P12Signer').P12Signer;
var { PDFDocument, rgb } = require('pdf-lib');

async function drawRect(pdfBuffer, rect, text) {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    const textSize = 10;
    const date = `${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`

    pages[0].drawRectangle({
        x: rect[0],
        y: rect[1],
        // width: rect[2] - rect[0],
        // height: rect[3] - rect[1],
        width: rect[2],
        height: rect[3],

        borderWidth: 1,
        borderColor: rgb(13/255,110/255,253/255),
        color: rgb(128/255,128/255,128/255),
    });
    pages[0].drawText(`${text} \nat ${date}`, {
        x: rect[0] + (textSize / 2),
        y: (rect[1] + rect[3]) - textSize,
        size: textSize,
        lineHeight: textSize * 1.2,
        font: await pdfDoc.embedFont('Helvetica'),
        color: rgb(255/255, 110/255, 253/255),
    });

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes, 'binary');
}

async function signPdf(pdfBuffer, certificateBuffer, info, rect) {
    var signer = new P12Signer(certificateBuffer, 'password');

    // The PDF needs to have a placeholder for a signature to be signed.
    var pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer: pdfBuffer,
        reason: info.reason,
        contactInfo: info.contactInfo,
        name: info.name,
        location: info.location,
        widgetRect: rect,
    });

    // pdfWithPlaceholder is now a modified buffer that is ready to be signed.
    pdfBuffer = await signpdf.sign(pdfWithPlaceholder, signer);
    withRectangle = await drawRect(pdfBuffer, rect, `Signed by ${info.name}`);
    return withRectangle;
}

async function signPdf2(pdfBuffer, certificateBuffer, password, info, signatures) {
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
    const w = pages[0].getWidth(), h = pages[0].getHeight();

    const textSize = 10;
    const date = `${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`

    for (let sign of signatures) {
        // const rect = [
        //     +sign.x,
        //     +sign.y,
        //     +sign.width,
        //     +sign.height
        // ].map((v, i) => v * 72 / 96);

        const rect = [
            +sign.x * pages[+sign.page-1].getWidth(),
            +sign.y * pages[+sign.page-1].getHeight(),
            +sign.width * pages[+sign.page-1].getWidth(),
            +sign.height * pages[+sign.page-1].getHeight()
        ];

        rect.y = h - rect.y

        pages[+sign.page-1].drawRectangle({
            x: rect[0],
            y: rect[1],
            width: rect[2],
            height: rect[3],

            borderWidth: 1,
            borderColor: rgb(13/255,110/255,253/255),
            color: rgb(128/255,128/255,128/255),
        });
        pages[+sign.page-1].drawText(`Signed by ${name} \nat ${date}`, {
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

module.exports = { signPdf, signPdf2, verifyPdf };