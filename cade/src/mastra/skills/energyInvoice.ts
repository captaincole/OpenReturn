import { ingestEnergyInvoice } from "../tools/ingestEnergyInvoice";
import { topicSkill } from "./topicSkill";

export const energyInvoiceSkill = topicSkill({
  name: "home-energy-invoice",
  description:
    "An invoice or receipt for home energy improvements: doors, windows, insulation, heat pumps, water heaters, furnaces, energy audits.",
  tools: { ingestEnergyInvoice },
  instructions: `- **Invoice or receipt for home energy improvements** (exterior doors, windows, skylights, insulation, central air, heat pumps, water heaters, furnaces, boilers, home energy audits) → \`ingest-energy-invoice\`. One call per invoice, one item per piece of property, with its 4-character QMID when printed. Solar, battery, geothermal, wind, and fuel cell property is not supported yet: say so. Then ask, one boolean fact each (category \`home_energy\`): installed on your main home in the U.S. (\`home_energy.main_home_in_us\`); you are the original user (\`home_energy.original_user\`); for doors, windows, or insulation, expected to last at least 5 years (\`home_energy.lasts_five_years\`) and related to building a new home (\`home_energy.new_home_construction\`).`,
});
