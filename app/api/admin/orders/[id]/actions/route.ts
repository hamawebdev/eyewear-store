import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  void request;
  void params;

  return NextResponse.json(
    {
      message: "Order admin actions are no longer available."
    },
    {
      status: 410
    }
  );
}
