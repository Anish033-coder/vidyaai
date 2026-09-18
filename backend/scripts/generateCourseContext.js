import dotenv from "dotenv";
dotenv.config();

import { connectDatabases } from "../config/db.js";
import { extractPDFText } from "../utils/pdfExtractor.js";

connectDatabases();

import { getCourseModel } from "../models/Course.js";
import { getLectureModel } from "../models/Lecture.js";
import { getCourseContextModel } from "../models/CourseContext.js";

const Course = getCourseModel();
const Lecture = getLectureModel();
const CourseContext = getCourseContextModel();

async function generateCourseContexts() {

  try {

    console.log("Generating course contexts...");

    const courses = await Course.find();

    for (const course of courses) {

      console.log(`Processing course: ${course.title}`);

      const lectures = await Lecture.find({
        _id: { $in: course.lectures }
      });

      let context = `Course: ${course.title}\n\n`;

      for (const lecture of lectures) {

        console.log(`Processing lecture: ${lecture.lectureTitle}`);

        let notesText = "";

        if (lecture.notesUrl) {
          notesText = await extractPDFText(lecture.notesUrl);
        }

        context += `
Lecture: ${lecture.lectureTitle}

Summary:
${lecture.summary}

Notes:
${notesText}

`;

      }

      await CourseContext.findOneAndUpdate(
        { courseId: course._id },
        { contextText: context },
        { upsert: true }
      );

    }

    console.log("All course contexts generated");

    process.exit();

  } catch (error) {

    console.error(error);
    process.exit(1);

  }

}

generateCourseContexts();