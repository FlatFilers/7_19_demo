import { FlatfileListener } from "@flatfile/listener";
import { recordHook } from "@flatfile/plugin-record-hook";
import { employeeValidations } from "./blueprints";
import { simpleSpaceSetup } from "./plugins/simple.space.setup";
import { employeeSheetMini } from "./blueprints/sheets/employees_mini";
import generateIds from "./jobs/generateIds";
import { FlatfileEvent } from "@flatfile/listener";
import api from "@flatfile/api";
import axios from "axios";
import { xlsxExtractorPlugin } from "@flatfile/plugin-xlsx-extractor";
import dedupeRecords from "./jobs/sheet/dedupe.records";

/**
 * This default export is used by Flatfile to register event handlers for any
 * event that occurs within the Flatfile Platform.
 *
 * @param listener
 */
export default function (listener: FlatfileListener) {
  listener.use(
    simpleSpaceSetup({
      space: {
        metadata: {
          sidebarConfig: {
            showDataChecklist: false,
            showSidebar: false,
          },
        },
      },
      workbook: {
        name: "Employee Import",
        sheets: [employeeSheetMini],
        actions: [
          {
            operation: "import-data",
            mode: "foreground",
            label: "Import Data",
            type: "string",
            description:
              "Once you click continue, your data will be imported to Second Street Labs.",
            primary: true,
          },
        ],
      },
    }),
  );

  listener.use(generateIds);
  listener.use(recordHook("employees", employeeValidations));
  listener.filter({ job: "workbook:import-data" }, (configure) => {
    configure.on(
      "job:ready",
      async ({ context: { jobId, workbookId }, payload }: FlatfileEvent) => {
        const { data: sheets } = await api.sheets.list({ workbookId });

        const records: { [name: string]: any } = {};
        for (const [index, element] of sheets.entries()) {
          records[`Sheet[${index}]`] = await api.records.get(element.id);
        }

        try {
          await api.jobs.ack(jobId, {
            info: "Starting job to submit data!",
            progress: 10,
          });

          console.log(JSON.stringify(records, null, 2));

          const webhookReceiver =
            process.env.WEBHOOK_SITE_URL ||
            "https://webhook.site/c83648d4-bf0c-4bb1-acb7-9c170dad4388";

          const response = await axios.post(
            webhookReceiver,
            {
              ...payload,
              method: "axios",
              sheets,
              records,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (response.status === 200) {
            await api.jobs.complete(jobId, {
              outcome: {
                message: "Data was successfully submitted. Go check it out!",
              },
            });
          } else {
            throw new Error("Failed to submit data!");
          }
        } catch (error) {
          console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`);

          await api.jobs.fail(jobId, {
            outcome: {
              message: "This job failed please reach out to support.",
            },
          });
        }
      },
    );
  });
  listener.use(dedupeRecords);
  listener.use(xlsxExtractorPlugin());
}
