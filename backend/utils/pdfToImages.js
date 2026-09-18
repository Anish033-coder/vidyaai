import pdfPoppler from "pdf-poppler";
import path from "path";
import fs from "fs";

export async function convertPDFToImages(pdfPath) {

  const outputDir = "uploads/images";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir,{recursive:true});
  }

  const opts = {
    format: "png",
    out_dir: outputDir,
    out_prefix: path.basename(pdfPath),
    page: null
  };

  await pdfPoppler.convert(pdfPath, opts);

  const files = fs.readdirSync(outputDir);

  return files.map(f => `${outputDir}/${f}`);
}