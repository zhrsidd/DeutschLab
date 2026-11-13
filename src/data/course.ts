import { unit1Curriculum, type CurriculumMonth } from "./unit1";

/*
 * The whole course as a structure (CURRICULUM.md §3). Only Unit 1 has
 * months and weeks; later units are listed so the Course page can show
 * the road ahead without implying their content exists.
 */

export interface CourseUnit {
  id: string;
  number: number;
  title: string;
  dates: string;
  /** Suggested windows, not progression deadlines. */
  startsOn: string;
  endsOn: string;
  target: string;
  /** Months with weeks; only implemented or planned in detail for Unit 1. */
  months?: CurriculumMonth[];
}

export const courseUnits: CourseUnit[] = [
  { id: "unit-1", number: 1, title: "Unit 1", dates: "15 Nov 2026 – 6 Mar 2027", startsOn: "2026-11-15", endsOn: "2027-03-06", target: "A0 → strong A1", months: unit1Curriculum },
  { id: "unit-2", number: 2, title: "Unit 2", dates: "7 Mar – 26 Jun 2027", startsOn: "2027-03-07", endsOn: "2027-06-26", target: "Strong A1 → strong A2" },
  { id: "unit-3", number: 3, title: "Unit 3", dates: "27 Jun – 18 Sep 2027", startsOn: "2027-06-27", endsOn: "2027-09-18", target: "A2 → B1" },
  { id: "unit-4", number: 4, title: "Unit 4", dates: "19 Sep – 11 Dec 2027", startsOn: "2027-09-19", endsOn: "2027-12-11", target: "B1 → B2" },
  { id: "unit-5", number: 5, title: "Unit 5", dates: "12 Dec 2027 – 8 Jan 2028", startsOn: "2027-12-12", endsOn: "2028-01-08", target: "B2 → C1 bridge" },
  { id: "unit-6", number: 6, title: "Unit 6", dates: "9 Jan – 4 Mar 2028", startsOn: "2028-01-09", endsOn: "2028-03-04", target: "C1 and certification preparation" },
];
