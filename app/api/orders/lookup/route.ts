import { NextResponse } from "next/server";

export async function GET(request: Request) {
  void request;

  return NextResponse.json(
    {
      message: "Order lookup is no longer available."
    },
    {
      status: 410
    }
  );
}
