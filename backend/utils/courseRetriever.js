import CourseEmbedding from "../models/CourseEmbedding.js";
import { createEmbedding } from "../services/embeddingService.js";

export async function retrieveCourseContext(courseId,query){

 const embedding = await createEmbedding(query);

 const lectures = await CourseEmbedding.find({
  courseId
 }).limit(5);

 return lectures.map(l=>l.text).join("\n\n");

}