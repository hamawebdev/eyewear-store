import { loadScriptPayloadClient } from "./payload-script-helpers";

const wilayasData = [
    { code: "01", name: "Adrar", nameAr: "أدرار", nameEn: "Adrar", homeDeliveryPrice: 1100, officeDeliveryPrice: 700 },
    { code: "02", name: "Chlef", nameAr: "الشلف", nameEn: "Chlef", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "03", name: "Laghouat", nameAr: "الأغواط", nameEn: "Laghouat", homeDeliveryPrice: 750, officeDeliveryPrice: 500 },
    { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", nameEn: "Oum El Bouaghi", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "05", name: "Batna", nameAr: "باتنة", nameEn: "Batna", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "06", name: "Béjaïa", nameAr: "بجاية", nameEn: "Béjaïa", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "07", name: "Biskra", nameAr: "بسكرة", nameEn: "Biskra", homeDeliveryPrice: 750, officeDeliveryPrice: 500 },
    { code: "08", name: "Béchar", nameAr: "بشار", nameEn: "Béchar", homeDeliveryPrice: 900, officeDeliveryPrice: 600 },
    { code: "09", name: "Blida", nameAr: "البليدة", nameEn: "Blida", homeDeliveryPrice: 550, officeDeliveryPrice: 350 },
    { code: "10", name: "Bouira", nameAr: "البويرة", nameEn: "Bouira", homeDeliveryPrice: 600, officeDeliveryPrice: 400 },
    { code: "11", name: "Tamanrasset", nameAr: "تمنراست", nameEn: "Tamanrasset", homeDeliveryPrice: 1400, officeDeliveryPrice: 900 },
    { code: "12", name: "Tébessa", nameAr: "تبسة", nameEn: "Tébessa", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "13", name: "Tlemcen", nameAr: "تلمسان", nameEn: "Tlemcen", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "14", name: "Tiaret", nameAr: "تيارت", nameEn: "Tiaret", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", nameEn: "Tizi Ouzou", homeDeliveryPrice: 600, officeDeliveryPrice: 350 },
    { code: "16", name: "Alger", nameAr: "الجزائر", nameEn: "Algiers", homeDeliveryPrice: 400, officeDeliveryPrice: 200 },
    { code: "17", name: "Djelfa", nameAr: "الجلفة", nameEn: "Djelfa", homeDeliveryPrice: 750, officeDeliveryPrice: 500 },
    { code: "18", name: "Jijel", nameAr: "جيجل", nameEn: "Jijel", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "19", name: "Sétif", nameAr: "سطيف", nameEn: "Sétif", homeDeliveryPrice: 700, officeDeliveryPrice: 400 },
    { code: "20", name: "Saïda", nameAr: "سعيدة", nameEn: "Saïda", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "21", name: "Skikda", nameAr: "سكيكدة", nameEn: "Skikda", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", nameEn: "Sidi Bel Abbès", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "23", name: "Annaba", nameAr: "عنابة", nameEn: "Annaba", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "24", name: "Guelma", nameAr: "قالمة", nameEn: "Guelma", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "25", name: "Constantine", nameAr: "قسنطينة", nameEn: "Constantine", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "26", name: "Médéa", nameAr: "المدية", nameEn: "Médéa", homeDeliveryPrice: 600, officeDeliveryPrice: 450 },
    { code: "27", name: "Mostaganem", nameAr: "مستغانم", nameEn: "Mostaganem", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "28", name: "M'Sila", nameAr: "المسيلة", nameEn: "M'Sila", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "29", name: "Mascara", nameAr: "معسكر", nameEn: "Mascara", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "30", name: "Ouargla", nameAr: "ورقلة", nameEn: "Ouargla", homeDeliveryPrice: 800, officeDeliveryPrice: 500 },
    { code: "31", name: "Oran", nameAr: "وهران", nameEn: "Oran", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "32", name: "El Bayadh", nameAr: "البيض", nameEn: "El Bayadh", homeDeliveryPrice: 800, officeDeliveryPrice: 500 },
    { code: "33", name: "Illizi", nameAr: "إليزي", nameEn: "Illizi", homeDeliveryPrice: 1600, officeDeliveryPrice: 1000 },
    { code: "34", name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", nameEn: "Bordj Bou Arreridj", homeDeliveryPrice: 650, officeDeliveryPrice: 400 },
    { code: "35", name: "Boumerdès", nameAr: "بومرداس", nameEn: "Boumerdès", homeDeliveryPrice: 550, officeDeliveryPrice: 400 },
    { code: "36", name: "El Tarf", nameAr: "الطارف", nameEn: "El Tarf", homeDeliveryPrice: 750, officeDeliveryPrice: 550 },
    { code: "37", name: "Tindouf", nameAr: "تندوف", nameEn: "Tindouf", homeDeliveryPrice: 1200, officeDeliveryPrice: 600 },
    { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", nameEn: "Tissemsilt", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "39", name: "El Oued", nameAr: "الوادي", nameEn: "El Oued", homeDeliveryPrice: 800, officeDeliveryPrice: 600 },
    { code: "40", name: "Khenchela", nameAr: "خنشلة", nameEn: "Khenchela", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", nameEn: "Souk Ahras", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "42", name: "Tipaza", nameAr: "تيبازة", nameEn: "Tipaza", homeDeliveryPrice: 550, officeDeliveryPrice: 450 },
    { code: "43", name: "Mila", nameAr: "ميلة", nameEn: "Mila", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", nameEn: "Aïn Defla", homeDeliveryPrice: 650, officeDeliveryPrice: 450 },
    { code: "45", name: "Naâma", nameAr: "النعامة", nameEn: "Naâma", homeDeliveryPrice: 800, officeDeliveryPrice: 500 },
    { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", nameEn: "Aïn Témouchent", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "47", name: "Ghardaïa", nameAr: "غرداية", nameEn: "Ghardaïa", homeDeliveryPrice: 800, officeDeliveryPrice: 550 },
    { code: "48", name: "Relizane", nameAr: "غليزان", nameEn: "Relizane", homeDeliveryPrice: 700, officeDeliveryPrice: 450 },
    { code: "49", name: "Timimoun", nameAr: "تيميمون", nameEn: "Timimoun", homeDeliveryPrice: 1100, officeDeliveryPrice: 600 },
    { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", nameEn: "Bordj Badji Mokhtar", homeDeliveryPrice: 1300, officeDeliveryPrice: 600 },
    { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", nameEn: "Ouled Djellal", homeDeliveryPrice: 800, officeDeliveryPrice: 600 },
    { code: "52", name: "Béni Abbès", nameAr: "بني عباس", nameEn: "Béni Abbès", homeDeliveryPrice: 1000, officeDeliveryPrice: 600 },
    { code: "53", name: "In Salah", nameAr: "عين صالح", nameEn: "In Salah", homeDeliveryPrice: 1500, officeDeliveryPrice: 900 },
    { code: "54", name: "In Guezzam", nameAr: "عين قزام", nameEn: "In Guezzam", homeDeliveryPrice: 0, officeDeliveryPrice: 0 },
    { code: "55", name: "Touggourt", nameAr: "تقرت", nameEn: "Touggourt", homeDeliveryPrice: 800, officeDeliveryPrice: 500 },
    { code: "56", name: "Djanet", nameAr: "جانت", nameEn: "Djanet", homeDeliveryPrice: 1600, officeDeliveryPrice: 0 },
    { code: "57", name: "El M'Ghair", nameAr: "المغير", nameEn: "El M'Ghair", homeDeliveryPrice: 800, officeDeliveryPrice: 0 },
    { code: "58", name: "El Meniaa", nameAr: "المنيعة", nameEn: "El Meniaa", homeDeliveryPrice: 800, officeDeliveryPrice: 0 }
];

async function seedWilayas() {
    const payload = await loadScriptPayloadClient();

    payload.logger.info("Seeding Wilayas...");

    for (const wilaya of wilayasData) {
        const existingWilaya = await payload.find({
            collection: "wilayas",
            where: {
                code: {
                    equals: wilaya.code
                }
            }
        });

        if (existingWilaya.docs.length > 0) {
            await payload.update({
                collection: "wilayas",
                id: (existingWilaya.docs[0] as any).id as string | number,
                data: wilaya
            });
            payload.logger.info(`Updated wilaya ${wilaya.name} (${wilaya.code})`);
            continue;
        }

        await payload.create({
            collection: "wilayas",
            data: wilaya
        });
        payload.logger.info(`Created wilaya ${wilaya.name} (${wilaya.code})`);
    }

    payload.logger.info("Successfully seeded Wilayas!");
    process.exit(0);
}

seedWilayas().catch((err) => {
    console.error(err);
    process.exit(1);
});
