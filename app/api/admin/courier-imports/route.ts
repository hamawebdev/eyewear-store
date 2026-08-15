import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;

  return NextResponse.json(
    {
      message: "Courier imports are no longer available."
    },
    {
      status: 410
    }
  );
}
