import mongoose from "mongoose";

const contextSchema = new mongoose.Schema({

  courseId:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
    unique:true
  },

  contextText:String

},{timestamps:true});

export default mongoose.model("CourseContext",contextSchema);