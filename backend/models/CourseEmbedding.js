import mongoose from "mongoose";

const courseEmbeddingSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  chunkText: {
    type: String,
    required: true
  },

  embedding: {
    type: [Number],
    required: true
  }

}, { timestamps: true });

export default mongoose.model(
  "CourseEmbedding",
  courseEmbeddingSchema
);