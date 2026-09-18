import cron from "node-cron";
import { syncEmbeddings } from "../scripts/syncEmbeddings.js";

export function startScheduler() {

  cron.schedule("*/1 * * * *", async () => {

    console.log("Running embedding sync...");

    await syncEmbeddings();

  });

}