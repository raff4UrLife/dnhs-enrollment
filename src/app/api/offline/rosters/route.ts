// src/app/api/offline/rosters/route.ts
import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/lib/auth/require-role";
import { loadRosterData } from "@/lib/sections/roster-data";

// Always run fresh and never let a browser or proxy keep a copy of this response.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Gives the offline saver a copy of the active school year's roster.
// Same rule as the offline sign-in note: admin and staff only.
export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json(
      { error: "Not signed in." },
      { status: 401, headers: NO_STORE },
    );
  }
  if (staff.role !== "admin" && staff.role !== "staff") {
    return NextResponse.json(
      { error: "Not allowed." },
      { status: 403, headers: NO_STORE },
    );
  }

  const data = await loadRosterData();
  if (!data) {
    return NextResponse.json(
      { error: "There is no active school year." },
      { status: 404, headers: NO_STORE },
    );
  }

  // The school year dropdown list is built offline from what is saved,
  // so it is left out to keep the response smaller.
  const { schoolYears, ...roster } = data;
  void schoolYears;

  return NextResponse.json(roster, { headers: NO_STORE });
}
