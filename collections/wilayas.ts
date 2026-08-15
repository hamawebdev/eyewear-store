import { CollectionConfig } from "payload";
import { ADMIN_COLLECTION_SLUG } from "./access";

export const Wilayas: CollectionConfig = {
    slug: "wilayas",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["code", "name", "homeDeliveryPrice", "officeDeliveryPrice"],
        description: "Manage wilayas and their delivery pricing"
    },
    access: {
        read: () => true, // Anyone can read wilayas (for checkout)
        create: ({ req: { user } }) => Boolean(user?.collection === ADMIN_COLLECTION_SLUG),
        update: ({ req: { user } }) => Boolean(user?.collection === ADMIN_COLLECTION_SLUG),
        delete: ({ req: { user } }) => Boolean(user?.collection === ADMIN_COLLECTION_SLUG)
    },
    fields: [
        {
            name: "code",
            type: "text",
            required: true,
            unique: true,
            admin: {
                description: "The wilaya number (e.g. 01, 16, 31)"
            }
        },
        {
            name: "name",
            type: "text",
            required: true,
            unique: true,
            admin: {
                description: "The French name of the wilaya"
            }
        },
        {
            name: "nameAr",
            type: "text",
            label: "Arabic name",
            admin: {
                description: "The Arabic name of the wilaya"
            }
        },
        {
            name: "nameEn",
            type: "text",
            label: "English name",
            admin: {
                description: "The English name of the wilaya"
            }
        },
        {
            name: "homeDeliveryPrice",
            type: "number",
            required: true,
            min: 0,
            admin: {
                description: "Home delivery price in DZD"
            }
        },
        {
            name: "officeDeliveryPrice",
            type: "number",
            required: true,
            min: 0,
            admin: {
                description: "Stop desk/Office delivery price in DZD"
            }
        }
    ]
};
