import { NextResponse } from "next/server";
import { getNewsletterData } from "@/lib/news-service";

export async function GET() {
  return NextResponse.json(await getNewsletterData());
}
