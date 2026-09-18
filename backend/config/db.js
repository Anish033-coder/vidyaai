import mongoose from "mongoose";

export async function connectDatabases() {

  try {

    // AI DB
    await mongoose.connect(process.env.AI_DB_URI);
    console.log("AI DB connected");

    // LMS DB
    global.lmsDB = await mongoose.createConnection(
      process.env.LMS_DB_URI
    ).asPromise();

    console.log("LMS DB connected");

  } catch (error) {

    console.error("DB connection error:", error);
    process.exit(1);

  }

}