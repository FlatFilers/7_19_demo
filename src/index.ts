import { FlatfileListener } from "@flatfile/listener";
import { recordHook } from "@flatfile/plugin-record-hook";
import { xlsxExtractorPlugin } from "@flatfile/plugin-xlsx-extractor";
import { XMLExtractor } from "@flatfile/plugin-xml-extractor";
//import { pdfExtractorPlugin } from "./jobs/pdf-extractor";
import {
  companyValidations,
  employeeValidations,
  locationValidations,
} from "./blueprints";
import { configureSpace } from "./jobs/space/configure";
import { seedCountries } from "./handlers/seed.countries";
import reviewData from "./jobs/workbook/review-data";
import watchList from "./jobs/sheet/check-watchlist";
import { xlsxSinkPlugin } from "./jobs/workbook/export";
import generateIds from "./jobs/generateIds";
import dedupeRecords from "./jobs/sheet/dedupe.records";

/**
 * This default export is used by Flatfile to register event handlers for any
 * event that occurs within the Flatfile Platform.
 *
 * @param listener
 */
export default function (listener: FlatfileListener) {
  listener.use(configureSpace);
  listener.use(seedCountries);
  listener.use(reviewData);
  listener.use(watchList);
  listener.use(generateIds);
  listener.use(dedupeRecords);

  listener.use(recordHook("companies", companyValidations));
  listener.use(recordHook("employees", employeeValidations));
  listener.use(recordHook("locations", locationValidations));

  listener.use(xlsxExtractorPlugin());
  listener.use(XMLExtractor());
  listener.use(xlsxSinkPlugin());
  //  listener.use(pdfExtractorPlugin());
}
