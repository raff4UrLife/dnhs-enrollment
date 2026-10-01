// One row in the applications table
export type ApplicationRow = {
  id: string;
  lrn: string;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  grade_level: number;
  gender: "Male" | "Female";
  status: "pending" | "approved";
  strand_name: string | null; // from the strands table (Grade 11-12 only)
};

// What the query returns for one page
export type ApplicationsResult = {
  rows: ApplicationRow[];
  total: number; // total matches across all pages
  page: number; // the page actually returned
};

export const PAGE_SIZE = 20;
