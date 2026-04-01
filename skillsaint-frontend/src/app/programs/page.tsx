import React from "react";
import ProgramsClient from "@/components/programs/ProgramsClient";
import { getProgramsData } from "@/lib/data";

export default async function ProgramsPage() {
  const data = await getProgramsData();

  return (
    <ProgramsClient data={data} />
  );
}
