import { NextResponse } from "next/server";
import { resolveChannelId } from "@/lib/parsers/youtube";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input } = body as { input: string };

    if (!input) {
      return NextResponse.json(
        { error: "input is required" },
        { status: 400 }
      );
    }

    const channelId = await resolveChannelId(input);
    return NextResponse.json({ channelId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resolution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
