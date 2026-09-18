import Lecture from "../models/Lecture.js";
import Course from "../models/Course.js";
import CourseEmbedding from "../models/CourseEmbedding.js";
import { extractPdfText } from "../utils/pdfExtractor.js";
import { chunkText } from "../utils/chunkText.js";
import { createEmbedding } from "../services/embeddingService.js";

export async function syncEmbeddings() {

  // console.log("Checking lectures...");

  let lectures = [];

  try {
    const result = await Lecture.find();
    lectures = Array.isArray(result) ? result : [];
  } catch (err) {
    console.error("Lecture fetch failed:", err);
    lectures = [];
  }

for (const lecture of lectures) {

  const course = await Course.findOne({ lectures: lecture._id });

  if (!course) {
    // console.log("No course found for lecture:", lecture.lectureTitle);
    continue;
  }

  const courseId = course._id;

  const exists = await CourseEmbedding.findOne({
    lectureId: lecture._id
  });

  if (exists) continue;

  console.log("Processing lecture:", lecture.lectureTitle);

    let notesText = "";

    // download and extract lecture notes if available
    if (lecture.notesUrl) {
      try {
        console.log("Downloading notes for:", lecture.lectureTitle);

        notesText = await extractPdfText(lecture.notesUrl);

        // clean extracted text
        notesText = notesText
          .replace(/\n+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      } catch (err) {
        console.error("PDF extraction failed for", lecture.lectureTitle, err.message);
      }
    }

    const text = `
Lecture: ${lecture.lectureTitle}

Summary:
${lecture.summary || ""}

Notes:
${notesText}
`;

    const chunks = chunkText(text);

    for (const chunk of chunks) {

      const embedding = await createEmbedding(chunk);

      await CourseEmbedding.create({
        courseId: courseId,
        lectureId: lecture._id,
        chunkText: chunk,
        embedding
      });

    }

    console.log("Embeddings created:", lecture.lectureTitle);
  }

}