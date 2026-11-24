/*
 * A made-up Form 1098-C. No scenario holds a vehicle gift, so this sample
 * shows the generator's output from an invented noncash gift fact. Every
 * name, address, TIN and vehicle number is invented.
 */

import type { NoncashGiftFactValue } from "../../../../src/facts/index.js";
import type { Form1098CBoxes, Form1098CParties } from "../form1098C.js";

/* The fact a donor with this form would have. The answers the form does not print are marked. */
export const SAMPLE_VEHICLE_GIFT: NoncashGiftFactValue = {
  donee: {
    name: "Valley Wheels for Charity",
    street: "418 Mission Ridge Rd",
    city: "Fresno",
    state: "CA",
    zip: "93721",
  },
  propertyType: "vehicle",
  /* Boxes 2a to 2d, with the condition the donor states. */
  description: "2016 Honda Accord, 118,420 miles, fair condition",
  contributionDate: "03/14/2025",
  /* The donor's answers: columns (e), (f), (g), the fair market value and its method. */
  dateAcquired: "06/10/2016",
  howAcquired: "Purchase",
  costBasis: 21500,
  fairMarketValue: 4200,
  valuationMethod: "Catalog",
  vehicle: {
    vin: "1SAMPLE2VEH000417",
    acknowledgmentAttached: true,
    grossProceeds: 2850,
    fmvException: false,
  },
};

export const SAMPLE_1098C_PARTIES: Form1098CParties = {
  doneeTin: "00-0001098",
  doneePhone: "(559) 555-0148",
  donorName: "Dana Whitcombe",
  donorTin: "400-00-1098",
  donorStreet: "2207 Cedar Hollow Ln",
  donorCityStateZip: "Clovis, CA 93611",
};

export const SAMPLE_1098C_BOXES: Form1098CBoxes = {
  calendarYear: 2025,
  box2a: "118,420",
  box2b: "2016",
  box2c: "Honda",
  box2d: "Accord",
  box4a: true,
  box4b: "04/02/2025",
  box6a: false,
};
