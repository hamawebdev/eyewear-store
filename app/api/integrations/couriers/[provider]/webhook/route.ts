import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  void request;
  void params;

  return NextResponse.json(
    {
      message: "Courier webhooks are no longer available."
    },
    {
      status: 410
    }
  );
}
