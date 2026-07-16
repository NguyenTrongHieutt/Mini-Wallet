import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptsDirectory, "..");
const canonicalPath = path.resolve(
  frontendDirectory,
  "../backend/docs/API/customer-openapi.yaml",
);
const frontendCopyPath = path.resolve(
  frontendDirectory,
  "customer-openapi.yaml",
);

const [canonical, frontendCopy] = await Promise.all([
  readFile(canonicalPath, "utf8"),
  readFile(frontendCopyPath, "utf8"),
]);

if (canonical !== frontendCopy) {
  console.error(
    "customer-openapi.yaml is out of sync. " +
      "Update the backend canonical spec first, then copy it to frontend/customer-openapi.yaml.",
  );
  process.exitCode = 1;
} else {
  console.log("Customer OpenAPI contract is in sync.");
}
