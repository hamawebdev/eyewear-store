import { NextResponse } from "next/server";

export async function GET(request: Request) {
  void request;

  return NextResponse.json(
    {
      message: "Order exports are no longer available."
    },
    {
      status: 410
    }
  );
}
