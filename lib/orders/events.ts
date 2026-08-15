import type { Payload } from "payload";
import type { PayloadRequest } from "payload";
import type { OrderEventActorSchema, OrderEventTypeSchema } from "@/lib/orders/schemas";
import type { z } from "zod";

type OrderEventType = z.infer<typeof OrderEventTypeSchema>;
type OrderEventActor = z.infer<typeof OrderEventActorSchema>;

export const SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY = "skipOrderEventHooks";

export const appendOrderEvent = async ({
  actorLabel,
  actorType,
  eventType,
  internalMessage,
  isPublic,
  order,
  payload,
  publicMessage,
  req
}: {
  actorLabel?: string;
  actorType: OrderEventActor;
  eventType: OrderEventType;
  internalMessage?: string;
  isPublic?: boolean;
  order: number | string;
  payload: Payload;
  publicMessage?: string;
  req?: PayloadRequest;
}) =>
  payload.create({
    collection: "order-events",
    context: {
      ...(req?.context ?? {}),
      [SKIP_ORDER_EVENT_HOOK_CONTEXT_KEY]: true
    },
    data: {
      actorLabel,
      actorType,
      eventType,
      internalMessage,
      isPublic,
      order,
      publicMessage
    },
    overrideAccess: true,
    req
  });
