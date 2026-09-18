import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPdfText(url) {

  try {

    const res = await fetch(url);
    const buffer = await res.arrayBuffer();

    const pdf = await pdfjs.getDocument({
      data: buffer,
      disableFontFace: true,
      useSystemFonts: true
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {

      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const pageText = content.items.map(item => item.str).join(" ");

      text += pageText + "\n";

    }

    return text;

  } catch (err) {

    console.error("PDF extraction failed:", err.message);
    return "";

  }

}