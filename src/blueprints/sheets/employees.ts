import { Flatfile } from "@flatfile/api";
import { FlatfileRecord } from "@flatfile/plugin-record-hook";
import { concatenateNames, splitFullName } from "../../common/nameProcessting";
import { validate } from "email-validator";

export const employeeSheet: Flatfile.SheetConfig = {
  name: "👥 Employees",
  slug: "employees",
  fields: [
    {
      key: "id",
      label: "Worker ID",
      type: "string",
      description: "This is the worker's identification number.",
      constraints: [
        {
          type: "required",
        },
        {
          type: "unique",
        },
      ],
    },
    {
      key: "country",
      label: "Country",
      type: "reference",
      config: {
        ref: "countries",
        key: "name",
        relationship: "has-one",
      },
    },
    {
      key: "full",
      label: "Worker Full Name",
      type: "string",
      description:
        "This field should auto populate as First Name, Middle Name, and Last Name are entered into those columns.",
    },
    {
      key: "first",
      label: "First Name",
      type: "string",
      description: "Provide the worker's legal first name.",
      constraints: [{ type: "required" }],
    },
    {
      key: "middle",
      label: "Middle Name",
      type: "string",
      description:
        "Please provide the worker's middle name. This is an optional field.",
    },
    {
      key: "last",
      label: "Last Name",
      type: "string",
      description: "Provide the worker's legal last name.",
      constraints: [{ type: "required" }],
    },
    {
      key: "type",
      label: "Worker Type",
      type: "enum",
      description:
        'Choose a value from the dropdown menu. Select "Employee" if the worker is paid by your company. Select "Contingent Worker" if the worker is a contracted worker that is not paid by your company.',
      config: {
        options: [
          { value: "EE", label: "Employee" },
          { value: "CW", label: "Contingent Worker" },
        ],
      },
      constraints: [{ type: "required" }],
    },
    {
      key: "email",
      label: "Email (Work)",
      type: "string",
      description:
        "Please populate this column with each worker's work email address. Make sure to enter the entire email in a standard email format. (ex. joe.brown@company.com).",
      constraints: [
        {
          type: "required",
        },
        {
          type: "unique",
        },
      ],
    },
    {
      key: "date",
      label: "Last Visit Date",
      type: "date",
      description: 'Provide the worker"s latest date of hire.',
    },
    {
      key: "title",
      label: "Job Title",
      type: "string",
      description: "Provide the job title of the employee",
    },
    {
      key: "company",
      label: "Company Name",
      type: "reference",
      description: "Choose a Company from the dropdown menu.",
      constraints: [{ type: "required" }],
      config: {
        ref: "companies",
        key: "name",
        relationship: "has-one",
      },
    },
    {
      key: "location",
      label: "Location",
      type: "reference",
      description:
        "Choose a Location from the dropdown menu. The menu consists of Locations you entered into the tenant during an earlier journey.",
      config: {
        ref: "locations",
        key: "name",
        relationship: "has-one",
      },
    },
  ],
  actions: [
    {
      operation: "generate-ids",
      mode: "background",
      label: "#️⃣ Generate IDs",
      description: "Adds a unique ID for employees that are missing one",
      primary: false,
    },
    {
      operation: "dedupe",
      mode: "foreground",
      label: "🔀 Dedupe",
      description: "Deduplicates employees based on ID",
      primary: false,
    },
    {
      operation: "enrich",
      mode: "foreground",
      label: "✨ Enrich",
      description:
        "Enrich employee data by running an API call to a 3rd party service",
      primary: false,
    },
    {
      operation: "tacos",
      mode: "background",
      label: "🌮 Send Tacos",
      description:
        "Send tacos to all employees in the current view. Must have valid location.",
      primary: false,
    },
    {
      operation: "backgroundCheck",
      mode: "background",
      label: "🕵️ Background Check",
      description:
        "Send selected employees to background check service for processing.",
      primary: false,
    },
  ],
};

export function employeeValidations(record: FlatfileRecord) {
  // Validate the input record parameter
  if (!record || typeof record !== "object") {
    console.error("Invalid record input. Expecting a valid record object.");
    return record;
  }

  // email validation

  try {
    const emailAddress = record.get("email");

    if (typeof emailAddress === "string") {
      // Use the EmailValidator library to check if the email address is in a valid format
      const isValid = validate(emailAddress);

      // If the email address is not valid, add an error message to the record
      if (!isValid) {
        record.addError(
          "email",
          "Email addresses must be in the format of 'xxx@yy.com'. Valid examples: john.doe@aol.com, jane@aol.com.",
        );
      }
    } else {
      record.addError("email", "Email address should be a string.");
    }
  } catch (error) {
    // If an exception occurs during execution of the function, add an error message to the record with the error details
    record.addError("email", `Error validating email format: ${error.message}`);
  }

  // date validation
  // visit date validation

  // Processes names: if names are split, it concatenates them. If name is full, it splits it into components
  try {
    console.log("Processing names...");
    concatenateNames(record);
    splitFullName(record);
    console.log("Names processed successfully.");
  } catch (error) {
    console.log("Error occurred during name processing:", error);
  }

  // Return the validated record
  return record;
}
