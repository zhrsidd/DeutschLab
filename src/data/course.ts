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
  target: string;
  /** Months with weeks; only implemented or planned in detail for Unit 1. */
  months?: CurriculumMonth[];
}

export const courseUnits: CourseUnit[] = [
  { id: "unit-1", number: 1, title: "Unit 1", dates: "Oct 2026 – Jan 2027", target: "A0 → strong A1", months: unit1Curriculum },
  { id: "unit-2", number: 2, title: "Unit 2", dates: "Feb – May 2027", target: "Strong A1 → strong A2" },
  { id: "unit-3", number: 3, title: "Unit 3", dates: "Jun – Aug 2027", target: "A2 → B1" },
  { id: "unit-4", number: 4, title: "Unit 4", dates: "Sep – Nov 2027", target: "B1 → B2" },
  { id: "unit-5", number: 5, title: "Unit 5", dates: "Dec 2027", target: "B2 → C1 bridge" },
  { id: "unit-6", number: 6, title: "Unit 6", dates: "Jan – Feb 2028", target: "C1 and certification preparation" },
];
