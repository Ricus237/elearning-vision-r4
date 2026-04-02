import { NextResponse } from "next/server";
import { fetchMoodle } from "@/lib/moodle";

export async function POST(request: Request) {
  try {
    const { function: wsFunction, params } = await request.json();

    if (!wsFunction) {
      return NextResponse.json({ status: "error", message: "Function is required" }, { status: 400 });
    }

    const result = await fetchMoodle(wsFunction, params || {});
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Moodle API Proxy Error:", error);
    return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 });
  }
}
