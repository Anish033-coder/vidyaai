import Tesseract from "tesseract.js";

export async function readTextFromImage(imagePath){

  const { data:{ text } } = await Tesseract.recognize(
    imagePath,
    "eng",
    {
      logger:m=>console.log(m.status)
    }
  );

  return text;
}