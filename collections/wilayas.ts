import { CollectionConfig } from "payload";
import { ADMIN_COLLECTION_SLUG } from "./access";

export const Wilayas: CollectionConfig = {
    slug: "wilayas",
    labels: {
        plural: { en: "Wilayas", fr: "Wilayas" },
        singular: { en: "Wilaya", fr: "Wilaya" }
    },
    admin: {
        useAsTitle: "name",
        defaultColumns: ["code", "name", "homeDeliveryPrice", "officeDeliveryPrice"],
        description: {
            en: "Manage wilayas and their delivery pricing",
            fr: "Gérer les wilayas et leurs tarifs de livraison"
        }
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
            label: { en: "Code", fr: "Code" },
            admin: {
                description: {
                    en: "The wilaya number (e.g. 01, 16, 31)",
                    fr: "Le numéro de la wilaya (ex. 01, 16, 31)"
                }
            }
        },
        {
            name: "name",
            type: "text",
            required: true,
            unique: true,
            label: { en: "French name", fr: "Nom (français)" },
            admin: {
                description: {
                    en: "The French name of the wilaya",
                    fr: "Le nom français de la wilaya"
                }
            }
        },
        {
            name: "nameAr",
            type: "text",
            label: { en: "Arabic name", fr: "Nom (arabe)" },
            admin: {
                description: {
                    en: "The Arabic name of the wilaya",
                    fr: "Le nom arabe de la wilaya"
                }
            }
        },
        {
            name: "nameEn",
            type: "text",
            label: { en: "English name", fr: "Nom (anglais)" },
            admin: {
                description: {
                    en: "The English name of the wilaya",
                    fr: "Le nom anglais de la wilaya"
                }
            }
        },
        {
            name: "homeDeliveryPrice",
            type: "number",
            required: true,
            min: 0,
            label: { en: "Home delivery price", fr: "Prix de livraison à domicile" },
            admin: {
                description: {
                    en: "Home delivery price in DZD",
                    fr: "Prix de la livraison à domicile en DZD"
                }
            }
        },
        {
            name: "officeDeliveryPrice",
            type: "number",
            required: true,
            min: 0,
            label: { en: "Office delivery price", fr: "Prix de livraison au bureau" },
            admin: {
                description: {
                    en: "Stop desk/Office delivery price in DZD",
                    fr: "Prix de la livraison en point relais / stop desk en DZD"
                }
            }
        }
    ]
};
