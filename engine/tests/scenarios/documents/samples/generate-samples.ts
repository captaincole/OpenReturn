/*
 * Renders the sample documents into this folder, for the document types no
 * scenario holds yet: npx tsx tests/scenarios/documents/samples/generate-samples.ts
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { form1098CPdf } from "../form1098C.js";
import {
  SAMPLE_1098C_BOXES,
  SAMPLE_1098C_PARTIES,
  SAMPLE_VEHICLE_GIFT,
} from "./form1098CSample.js";

const samplesDir = dirname(fileURLToPath(import.meta.url));

const SAMPLES = [
  {
    file: "1098-c-valley-wheels.pdf",
    render: () => form1098CPdf(SAMPLE_VEHICLE_GIFT, SAMPLE_1098C_PARTIES, SAMPLE_1098C_BOXES),
  },
];

async function main() {
  for (const { file, render } of SAMPLES) {
    const pdf = await render();
    await writeFile(join(samplesDir, file), pdf);
    console.log(`✓ ${file} (${pdf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
