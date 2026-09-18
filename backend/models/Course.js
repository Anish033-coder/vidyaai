import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: String,
  category: String,
  lectures: [mongoose.Schema.Types.ObjectId]
}, { timestamps: true });

function getCourseModel() {
  if (!global.lmsDB) {
    throw new Error("LMS DB not connected yet");
  }

  return (
    global.lmsDB.models.Course ||
    global.lmsDB.model("Course", courseSchema)
  );
}

const Course = new Proxy({}, {
  get(_, prop) {
    const model = getCourseModel();
    const value = model[prop];

    if (typeof value === "function") {
      return value.bind(model);
    }

    return value;
  }
});

export default Course;