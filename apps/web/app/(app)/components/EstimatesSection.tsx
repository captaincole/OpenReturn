/*
 * Tax estimates — placeholder. An estimate works like a return but runs
 * on the 1040-ES estimated-tax worksheet for the year in progress.
 */

import { CURRENT_TAX_YEAR } from "./constants";
import { LockIcon } from "./Lock";
import { Section } from "./Section";

export function EstimatesSection() {
  const estimateYear = CURRENT_TAX_YEAR + 1;
  return (
    <Section title="Tax estimates">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card flex flex-col gap-3 p-5">
          <div className="text-[10px] tracking-[0.18em] text-ink-muted uppercase">
            Tax Year {estimateYear}
          </div>
          <div>
            <div className="text-[15px] font-medium text-ink-primary">
              {estimateYear} estimated taxes
            </div>
            <div className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
              Project this year&apos;s tax and plan your quarterly payments with the estimated-tax
              worksheet.
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <LockIcon className="h-3 w-3" />
            <span>Coming soon</span>
          </div>
        </div>
      </div>
    </Section>
  );
}
