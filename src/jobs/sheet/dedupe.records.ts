import { FlatfileListener } from "@flatfile/listener";
import api from "@flatfile/api";
import { DedupeRecords } from "../../common/dedupe.records";

export default function (listener: FlatfileListener) {
  listener.filter({ job: "sheet:dedupeWorkers" }, (configure) => {
    configure.on("job:ready", async (event) => {
      const { jobId, sheetId } = event.context;

      try {
        await api.jobs.ack(jobId, {
          info: "Deduplicating Workers...",
          progress: 10, //optional
        });

        // Call the dedupeEmployees function with the records
        await new DedupeRecords(sheetId, "full").dedupeRecords();

        await api.jobs.complete(jobId, {
          info: "This job is now complete.",
        });
      } catch (error) {
        console.log(`Error: ${JSON.stringify(error, null, 2)}`);

        await api.jobs.fail(jobId, {
          info: "This job did not work.",
        });
      }
    });
  });
}
