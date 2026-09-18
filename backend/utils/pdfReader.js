import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractPDFText(buffer) {

  const loadingTask = pdfjs.getDocument({ data: buffer });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {

    const page = await pdf.getPage(i);

    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map(item => item.str)
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText;
}