import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  lectureTitle: String,
  summary: String,
  notesUrl: String,
  courseId: mongoose.Schema.Types.ObjectId
});

function getLectureModel() {
  if (!global.lmsDB) {
    throw new Error("LMS DB not connected yet");
  }

  return (
    global.lmsDB.models.Lecture ||
    global.lmsDB.model("Lecture", lectureSchema)
  );
}

const Lecture = new Proxy(
  {},
  {
    get(_, prop) {
      const model = getLectureModel();
      const value = model[prop];

      if (typeof value === "function") {
        return value.bind(model);
      }

      return value;
    }
  }
);

export default Lecture;