import { after, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  CheckoutValidationError,
  buildGoogleSheetsOrderRow,
  sendGoogleSheetsOrderRow,
  type GoogleSheetsOrderMeta
} from "@/lib/google-sheets";
import {
  getClientIpFromHeaders,
  parseMetaCookies,
  sendMetaServerEvent
} from "@/lib/meta/capi.server";
import { META_EVENTS } from "@/lib/meta/events";
import { CreateOrderInputSchema, type CreateOrderInput } from "@/lib/orders/schemas";

const getValidationMessage = (error: ZodError) =>
  error.issues[0]?.message || "Please review your checkout details and try again.";

/**
 * Request-scoped data needed for the Meta Conversions API Purchase event.
 * Captured synchronously from the request before the response is flushed,
 * because the request is not safely usable inside `after()`.
 */
type MetaRequestContext = {
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

const buildMetaRequestContext = (request: Request, input: CreateOrderInput): MetaRequestContext => {
  const { fbp, fbc } = parseMetaCookies(request.headers.get("cookie"));
  const origin = request.headers.get("origin") || new URL(request.url).origin;

  return {
    clientIpAddress: getClientIpFromHeaders(request.headers),
    clientUserAgent: request.headers.get("user-agent") || undefined,
    fbp,
    fbc,
    eventSourceUrl: `${origin}/${input.locale ?? "ar"}/checkout`
  };
};

/**
 * Send the server-side Purchase to the Conversions API. Shares the `orderRef`
 * as the dedup `event_id` with the browser Pixel Purchase so Meta counts the
 * conversion once. Never throws (the CAPI client swallows failures); run from
 * `after()` so it stays off the customer's response path.
 */
const sendServerPurchase = async ({
  orderRef,
  meta,
  input,
  context
}: {
  orderRef: string;
  meta: GoogleSheetsOrderMeta;
  input: CreateOrderInput;
  context: MetaRequestContext;
}) => {
  await sendMetaServerEvent({
    eventName: META_EVENTS.purchase,
    eventId: orderRef,
    eventSourceUrl: context.eventSourceUrl,
    userData: {
      fullName: input.fullName,
      phone: input.phoneNumber,
      city: input.wilaya,
      state: input.wilaya,
      country: "dz",
      clientIpAddress: context.clientIpAddress,
      clientUserAgent: context.clientUserAgent,
      fbp: context.fbp,
      fbc: context.fbc
    },
    customData: {
      value: meta.valueMajor,
      currency: meta.currency,
      content_type: "product",
      content_ids: meta.contentIds,
      contents: meta.contents,
      num_items: meta.numItems
    }
  });
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const input = CreateOrderInputSchema.parse(body);

    // Validate the order and build the row up-front using fast local DB
    // lookups, so genuine checkout errors are still surfaced to the customer.
    const { meta, orderRef, row } = await buildGoogleSheetsOrderRow({
      input
    });

    // Capture request-scoped tracking data now; the request is not safely
    // usable inside after().
    const metaContext = buildMetaRequestContext(request, input);

    // The Google Sheets webhook (Apps Script) is slow, so it is pushed off the
    // response path. after() keeps this running once the response is flushed,
    // letting the customer reach the thank-you page immediately while the order
    // is still recorded.
    after(async () => {
      try {
        await sendGoogleSheetsOrderRow({
          row
        });
      } catch (error) {
        console.error(
          `[checkout] Background Google Sheets sync failed for order ${orderRef}:`,
          error
        );
      }

      // Server-side Purchase for Meta. Deduped with the browser Pixel via
      // orderRef. Failures are swallowed by the CAPI client and must never
      // affect the order.
      await sendServerPurchase({ orderRef, meta, input, context: metaContext });
    });

    return NextResponse.json(
      {
        orderRef
      },
      {
        status: 201
      }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          message: "Invalid request body."
        },
        {
          status: 400
        }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: getValidationMessage(error)
        },
        {
          status: 400
        }
      );
    }

    if (error instanceof CheckoutValidationError) {
      return NextResponse.json(
        {
          message: error.message
        },
        {
          status: 400
        }
      );
    }

    console.error("[checkout] Unexpected error:", error);

    return NextResponse.json(
      {
        message: "Unable to submit your order right now. Please try again."
      },
      {
        status: 500
      }
    );
  }
}
