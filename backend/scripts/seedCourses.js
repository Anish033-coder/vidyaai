// Seeds the LMS database with the courses the tutor offers, and prints the
// courseId for each one.
//
// The Knowledge Base filters retrieval on a `courseId` metadata attribute, so
// each course here needs a matching `<file>.pdf.metadata.json` sidecar in S3.
// This prints that sidecar JSON ready to paste, so the two can't drift.
//
// Usage:
//   node scripts/seedCourses.js "Economics — Unit 3" "Data Structures — Trees"
//   node scripts/seedCourses.js            (uses the defaults below)

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const DEFAULT_TITLES = ["Economics — Unit 3", "Data Structures — Unit 3"];

const argv = process.argv.slice(2);

// --replace drops any course not named here. A course with no matching PDF in
// the knowledge base retrieves nothing, so leaving stale ones in the picker
// just gives you a way to demo an empty answer.
const replace = argv.includes("--replace");
const titles = argv.filter((a) => a !== "--replace");
const wanted = titles.length ? titles : DEFAULT_TITLES;

const uri = process.env.LMS_DB_URI;

if (!uri) {
  console.error("LMS_DB_URI is not set in .env");
  process.exit(1);
}

const courseSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    lectures: [mongoose.Schema.Types.ObjectId],
  },
  { timestamps: true }
);

const conn = await mongoose.createConnection(uri).asPromise();
const Course = conn.model("Course", courseSchema);

console.log(`\nConnected to ${conn.name}\n`);

const results = [];

for (const title of wanted) {
  // Upsert so re-running keeps the same id — re-seeding must not invalidate
  // the metadata sidecars already uploaded to S3.
  const course = await Course.findOneAndUpdate(
    { title },
    { $setOnInsert: { title, category: "General", lectures: [] } },
    { upsert: true, returnDocument: "after" }
  );
  results.push(course);
  console.log(`  ${course._id}  ${course.title}`);
}

console.log("\n--- metadata sidecars for S3 ---");
console.log("Upload one per PDF, named <exact-pdf-filename>.metadata.json\n");

for (const c of results) {
  console.log(`  for the PDF belonging to "${c.title}":`);
  console.log(
    `  ${JSON.stringify({ metadataAttributes: { courseId: String(c._id) } })}\n`
  );
}

if (replace) {
  const keep = results.map((c) => c._id);
  const { deletedCount } = await Course.deleteMany({ _id: { $nin: keep } });
  if (deletedCount) {
    console.log(`Removed ${deletedCount} course(s) with no content behind them.\n`);
  }
}

console.log("All courses now in the collection:");
for (const c of await Course.find({}, { title: 1 })) {
  console.log(`  ${c._id}  ${c.title}`);
}

await conn.close();
console.log("\nDone.\n");
