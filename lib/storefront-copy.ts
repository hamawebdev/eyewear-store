import type { StorefrontLanguage } from "@/lib/storefront-language";

export const STOREFRONT_COPY = {
  ar: {
    cart: {
      checkout: "إتمام الطلب",
      continueShopping: "متابعة التسوق",
      emptyDescription: "يبدو أنك لم تضف أي منتجات بعد إلى سلة التسوق.",
      emptyTitle: "سلة التسوق فارغة",
      quantity: "الكمية",
      title: "سلة التسوق",
      total: "الإجمالي"
    },
    categories: {
      eyebrow: "الفهرس",
      headlineLines: ["لكل نظرة", "إطارها."],
      lede: "ست عائلات، من الشمسية المستقطبة إلى إطارات الأطفال. توصيل إلى 58 ولاية، وحماية UV400 حقيقية في كل قطعة.",
      moreInfo: "عرض الفئة",
      title: "تسوّق حسب الفئة",
      unit: "فئات",
      viewAll: "تصفّح الفهرس كاملا"
    },
    checkout: {
      address: "العنوان",
      addressPlaceholder: "الشارع، المبنى، الطابق، وأي معلم يساعد المندوب...",
      deliveryDetails: "تفاصيل التوصيل",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      homeDelivery: "توصيل إلى المنزل",
      officePickup: "استلام من المكتب",
      orderSummary: "ملخص الطلب",
      phoneNumber: "رقم الهاتف",
      phonePlaceholder: "أدخل رقم هاتفك",
      placeOrder: "تأكيد الطلب",
      processing: "جاري إرسال الطلب...",
      quantity: "الكمية",
      selectWilaya: "اختر ولايتك",
      shippingMethod: "طريقة التوصيل",
      subtotal: "المجموع الفرعي",
      title: "إتمام الطلب",
      total: "الإجمالي",
      wilaya: "الولاية",
      free: "مجاني"
    },
    contact: {
      additionalCards: [
        {
          body: "تحدث مباشرة مع فريق خدمة العملاء للحصول على مساعدة سريعة.",
          title: "اتصل بنا"
        },
        {
          body: "راسلنا وسنعود إليك خلال 24 ساعة في أيام العمل.",
          title: "دعم عبر البريد"
        },
        {
          body: "زر متجرنا لاكتشاف المنتجات عن قرب.",
          title: "زر المتجر"
        }
      ],
      intro: "يسرّنا أن نسمع منك. أرسل رسالتك وسنرد عليك في أقرب وقت ممكن.",
      messageLabel: "الرسالة *",
      messagePlaceholder: "اشرح طلبك أو سؤالك بالتفصيل...",
      phoneLabel: "رقم الهاتف *",
      reset: "إرسال رسالة أخرى",
      subjectLabel: "الموضوع *",
      subjects: [
        { label: "اختر موضوعًا", value: "" },
        { label: "استفسار عام", value: "general" },
        { label: "دعم الطلبات", value: "order" },
        { label: "الإرجاع والاستبدال", value: "returns" },
        { label: "سؤال عن العدسات أو الهيكل", value: "quality" },
        { label: "استفسار عن الفواتير", value: "billing" },
        { label: "طلب شراكة", value: "partnership" }
      ],
      submit: "إرسال الرسالة",
      submitting: "جارٍ الإرسال...",
      successBody: "شكرًا لتواصلك معنا. سنرد عليك خلال 24 ساعة.",
      successTitle: "تم إرسال رسالتك بنجاح",
      title: "تواصل معنا",
      writeMessage: "أرسل لنا رسالة"
    },
    faq: {
      contactCta: "تواصل معنا",
      contactDescription:
        "راسلنا إذا كانت لديك أسئلة حول التوصيل، الطلبات الكبيرة، أو اختيار الهيكل المناسب لوجهك.",
      contactTitle: "هل تحتاج مساعدة بخصوص طلبك؟",
      intro:
        "إجابات واضحة حول التوصيل، الدفع، وكيفية متابعة الطلبات لعملائنا في جميع أنحاء الجزائر.",
      items: [
        {
          answer:
            "نعم، نوصل إلى جميع ولايات الجزائر. يختلف وقت الوصول حسب الولاية ومسار شركة التوصيل، وعادة تصل المدن الكبرى أسرع من المناطق البعيدة.",
          question: "هل توصلون إلى جميع ولايات الجزائر؟"
        },
        {
          answer:
            "نعم، الدفع عند الاستلام هو الخيار المفضل لدى أغلب زبائننا. وإذا كانت هناك أي قيود خاصة بمنطقتك فسيخبرك فريقنا بأفضل طريقة قبل الشحن.",
          question: "هل يمكنني الدفع عند الاستلام؟"
        },
        {
          answer:
            "بعد تسجيل الطلب قد نتواصل معك هاتفيًا أو عبر رسالة للتأكد من البيانات، العنوان، وتوفر المنتجات حتى تصل الشحنة بسرعة ومن دون مشاكل.",
          question: "كيف يتم تأكيد طلبي بعد إرساله؟"
        },
        {
          answer:
            "طلبات المدن الكبرى تصل عادة أسرع، بينما قد تحتاج الولايات الأخرى وقتًا إضافيًا قليلًا بحسب شبكة التوصيل. بعد التأكيد نعمل على إرسال الطلب في أسرع وقت.",
          question: "كم يستغرق التوصيل عادة؟"
        },
        {
          answer:
            "كل نظارة تحمل فلتر UV400 حقيقيا، وكل هيكل يُفحص ويُضبط قبل التغليف. وإذا احتجت مساعدة في اختيار الشكل المناسب لوجهك فنحن هنا لمرافقتك.",
          question: "كيف أعرف أن العدسات تحمي عينيّ فعلا؟"
        },
        {
          answer:
            "تواصل معنا في أقرب وقت مع تفاصيل الطلب وصورة للطرد إن أمكن. سنراجع الحالة سريعًا ونساعدك في التعويض أو التصحيح المناسب.",
          question: "ماذا أفعل إذا وصل الطرد متضررًا أو كان الطلب غير صحيح؟"
        }
      ],
      title: "أسئلة قبل الطلب"
    },
    featuredProducts: {
      title: "أفضل منتجاتنا"
    },
    footer: {
      creditConnector: "، بالتعاون مع",
      creditPrefix: "الموقع من تطوير",
      copyright: "جميع الحقوق محفوظة.",
      description:
        "نظارات شمسية، هياكل طبية، نظارات الضوء الأزرق ونظارات القراءة، مختارة من أجل حماية حقيقية من الأشعة، صناعة صادقة وسعر عادل."
    },
    fullScreenMenu: {
      items: [
        { href: "/contact", label: "اتصل بنا" },
        { href: "/products", label: "المنتجات" }
      ],
      location: "الجزائر العاصمة، الجزائر"
    },
    hero: {
      cta: "اكتشف نظاراتنا",
      headingLines: ["ترى الدنيا", "أوضح"]
    },
    navigation: {
      allProducts: {
        body: "تصفح كامل تشكيلة النظارات لدينا.",
        title: "كل المنتجات"
      },
      faq: {
        body: "إجابات حول المقاسات، التوصيل والعناية بالنظارة.",
        title: "الأسئلة الشائعة"
      },
      featured: {
        body: "تشكيلة هذا الموسم: أشكال جديدة وعدسات بحماية UV400.",
        title: "تشكيلة جديدة"
      },
      guide: {
        body: "كيف تختار الشكل الذي يناسب وجهك.",
        title: "دليل اختيار الهيكل"
      },
      highlights: [
        {
          body: "حماية كاملة من الأشعة فوق البنفسجية لشمس الجزائر.",
          slug: "sunglasses",
          title: "نظارات شمسية"
        },
        {
          body: "عدسات تلطّف ضوء الشاشات في أيام العمل الطويلة.",
          slug: "blue-light",
          title: "نظارات الضوء الأزرق"
        },
        {
          body: "علب، حبال ومنتجات تنظيف تطيل عمر نظارتك.",
          slug: "accessories",
          title: "إكسسوارات"
        }
      ],
      quickLinks: "روابط سريعة",
      shop: "المتجر"
    },
    navbar: {
      cartAriaLabel: "فتح سلة التسوق"
    },
    orderLookup: {
      confirmation: "التأكيد",
      courierDetails: "تفاصيل شركة التوصيل",
      courierProvider: "شركة التوصيل",
      courierTracking: "رقم التتبع",
      courierTrackingLink: "فتح صفحة التتبع",
      courierUnassigned: "لم يتم التعيين بعد",
      emptyState:
        "بعد إدخال رقم طلب صحيح ورقم الهاتف المستعمل عند الشراء، سيظهر هنا ملخص الطلب وخط سيره.",
      emptyTitle: "في انتظار البحث",
      error: "تعذر العثور على الطلب.",
      exchange: "الاستبدال",
      guestLookup: "متابعة طلب بدون حساب",
      intro: "أدخل مرجع الطلب ورقم الهاتف الذي استعملته عند الدفع.",
      loading: "جاري التحقق...",
      lookupAction: "عرض الطلب",
      lookupFallback: "جاري تحميل صفحة متابعة الطلب...",
      noTimeline: "لا توجد أحداث عامة متاحة لهذا الطلب حاليًا.",
      notAssigned: "قيد الانتظار",
      openTimeline: "الخط الزمني",
      orderRef: "مرجع الطلب",
      payment: "الدفع",
      phoneNumber: "رقم الهاتف",
      placeholderOrderRef: "ORD-20260316-ABC123",
      placeholderPhone: "0555 00 00 00",
      title: "تتبع الطلب",
      total: "الإجمالي"
    },
    productCard: {
      addToCart: "أضف إلى السلة"
    },
    productDetail: {
      addToCart: "أضف إلى السلة",
      buyNow: "اشترِ الآن",
      keyPoints: "أهم المميزات",
      notFound: "المنتج غير موجود",
      quantity: "الكمية",
      redirecting: "جارٍ التحويل...",
      relatedProducts: "منتجات مشابهة",
      reviewsLabel: "مراجعة"
    },
    productOptions: {
      chooseSize: "اختر الخيار المناسب",
      save: "وفّر"
    },
    productAttributes: {
      frameShape: "شكل الهيكل",
      gender: "الفئة",
      frameColor: "اللون",
      reset: "مسح الفلاتر",
      shapes: {
        round: "مدوّرة",
        square: "مربّعة",
        rectangle: "مستطيلة",
        aviator: "أفياتور",
        "cat-eye": "عين القطة",
        oval: "بيضاوية",
        hexagonal: "سداسية",
        wayfarer: "وايفارر"
      },
      genders: {
        men: "رجال",
        women: "نساء",
        unisex: "للجنسين",
        kids: "أطفال"
      },
      colors: {
        black: "أسود",
        tortoise: "بني مرقّط",
        gold: "ذهبي",
        silver: "فضي",
        brown: "بني",
        blue: "أزرق",
        transparent: "شفاف",
        "rose-gold": "ذهبي وردي"
      }
    },
    productReviews: {
      approved: "مراجعة معتمدة",
      approvedPlural: "مراجعات معتمدة",
      averageOutOfFive: "من 5",
      contentLabel: "رأيك",
      contentPlaceholder: "أخبرنا بما أعجبك وكيف استعملت المنتج.",
      emptyStatePrefix: "لا توجد مراجعات معتمدة لـ",
      emptyStateSuffix: "حتى الآن. كن أول من يشارك تجربته.",
      intro: "تخضع المراجعات للمراجعة قبل ظهورها في المتجر.",
      nameLabel: "الاسم",
      namePlaceholder: "اسمك",
      pendingMessage: "شكرًا لك. تم استلام مراجعتك وهي بانتظار الاعتماد.",
      ratingLabel: "التقييم",
      ratingOption: "نجوم",
      submit: "إرسال المراجعة",
      submitting: "جارٍ الإرسال...",
      submissionError: "تعذر إرسال مراجعتك الآن. يرجى المحاولة مرة أخرى.",
      title: "آراء العملاء",
      writeReview: "اكتب مراجعة"
    },
    productsPage: {
      allCategories: "كل المنتجات",
      allPrices: "كل الأسعار",
      category: "الفئة",
      emptyState: "لم نعثر على منتجات تطابق المعايير المحددة.",
      filterButton: "الفلاتر",
      filterTitle: "الفلاتر والترتيب",
      heading: "منتجاتنا",
      loading: "جاري تحميل المنتجات...",
      over10000: "أكثر من 10 000 دج",
      priceHigh: "السعر: من الأعلى إلى الأقل",
      priceLow: "السعر: من الأقل إلى الأعلى",
      priceRange: "نطاق السعر",
      rating: "الأعلى تقييمًا",
      sortBy: "ترتيب حسب",
      sortFeatured: "مميزة",
      sortNewest: "الأحدث",
      under3000: "أقل من 3 000 دج",
      range3000to6000: "3 000 دج - 6 000 دج",
      range6000to10000: "6 000 دج - 10 000 دج"
    },
    productsSpotlight: {
      browseCategory: "استعرض الفئة",
      nextCategory: "الفئة التالية",
      previousCategory: "الفئة السابقة"
    },
    brandPromise: {
      claims: ["حماية UV400 حقيقية،", "هياكل تدوم،", "وسعر في المتناول."]
    },
    returns: {
      damagedItems: {
        body: "إذا استلمت منتجًا متضررًا أو به خلل، تواصل معنا فورًا. سنقترح إرجاعًا مجانيًا، تعويضًا أو استبدالًا حسب الحالة.",
        highlight:
          "مهم: التقط صورًا للمنتج والتغليف قبل الإرجاع حتى نتمكن من تحسين طريقة التعبئة والتوصيل.",
        title: "المنتجات المتضررة أو المعيبة"
      },
      exchange: {
        body: "لا نوفر الاستبدال المباشر حاليًا. إذا رغبت في لون آخر أو موديل مختلف، أعد النظارة الأصلية ثم سجّل طلبًا جديدًا للمنتج المطلوب.",
        highlight:
          "نصيحة: اطلب المنتج الجديد أولًا إذا كان متوفرًا حتى لا تنتظر انتهاء معالجة الإرجاع.",
        title: "الاستبدال"
      },
      help: {
        body: "فريق خدمة العملاء جاهز للإجابة عن أسئلة الإرجاع أو الاستبدال.",
        contact: ["البريد: returns@store.com", "الهاتف: 1-800-STORE-01"],
        title: "هل تحتاج إلى مساعدة؟"
      },
      intro:
        "نريدك أن تكون راضيًا تمامًا عن مشترياتك. إذا لم يكن الطلب مناسبًا لك، سنساعدك عبر سياسة إرجاع واضحة وسهلة.",
      international: {
        items: [
          "تكاليف الإرجاع الدولي يتحملها الزبون.",
          "يجب إعادة المنتجات إلى مستودعنا.",
          "الرسوم الجمركية والضرائب غير قابلة للاسترجاع.",
          "قد يستغرق المعالجة من 10 إلى 14 يوم عمل."
        ],
        title: "الإرجاع الدولي"
      },
      overview: {
        cards: [
          { title: "يومًا للإرجاع", value: "30" },
          { title: "شحن إرجاع مجاني", value: "مجاني" },
          { title: "ضمان استرجاع", value: "100%" }
        ],
        title: "نظرة عامة على سياسة الإرجاع"
      },
      process: {
        steps: [
          {
            body: "ابدأ الطلب من خلال حسابك أو تواصل معنا وحدد المنتج المراد إرجاعه.",
            title: "ابدأ الإرجاع"
          },
          {
            body: "سنرسل لك تعليمات الإرجاع والملصق إن كان ذلك متاحًا.",
            title: "حضّر الملصق"
          },
          {
            body: "غلّف المنتج جيدًا وسلّمه إلى نقطة الشحن المناسبة.",
            title: "غلّف وأرسل"
          },
          {
            body: "بعد التحقق من الإرجاع، نطلق التعويض خلال أيام العمل التالية.",
            title: "استرجاع المبلغ"
          }
        ],
        title: "طريقة إرجاع المنتج"
      },
      table: {
        headers: ["نوع المنتج", "مهلة الإرجاع", "مدة استرجاع المبلغ"],
        rows: [
          ["النظارات الشمسية والهياكل", "30 يومًا", "5 إلى 7 أيام عمل"],
          ["نظارات القراءة", "30 يومًا", "5 إلى 7 أيام عمل"],
          ["منتجات التخفيضات", "14 يومًا", "5 إلى 7 أيام عمل"]
        ],
        title: "مواعيد الإرجاع"
      },
      title: "الإرجاع والاستبدال",
      whatCanBeReturned: {
        nonReturnable: [
          "المنتجات المخصصة أو الشخصية.",
          "المنتجات القابلة للتلف.",
          "المنتجات المتضررة بسبب سوء الاستخدام.",
          "التحميلات الرقمية."
        ],
        returnable: [
          "المنتجات في حالتها الأصلية.",
          "الهياكل غير المستعملة مع بطاقاتها الأصلية.",
          "المنتجات داخل تغليفها الأصلي.",
          "مجموعات الهدايا الكاملة."
        ],
        title: "ما الذي يمكن إرجاعه؟"
      }
    },
    shipping: {
      deliveryInfo: {
        issues: [
          "تم تعليم الطرد كمسلم لكنه لم يصل.",
          "وصل الطرد متضررًا.",
          "حدث خطأ في عنوان التوصيل.",
          "فشلت محاولات التوصيل المتعددة."
        ],
        requirements: [
          "قد يلزم توقيع عند الاستلام للطلبات ذات القيمة العالية.",
          "يمكن ترك الطرد عند الباب لبعض الطلبات القياسية.",
          "قد تحتاج طلبات الشقق إلى تسهيل الوصول للبناية.",
          "صناديق البريد لا تناسب جميع الشحنات."
        ],
        title: "معلومات التوصيل"
      },
      freeShipping: {
        body: "استفد من الشحن القياسي المجاني عندما يتجاوز طلبك 100 دج. يطبق الخصم تلقائيًا أثناء إتمام الشراء.",
        items: [
          "ينطبق على الشحن القياسي داخل الجزائر.",
          "يجب أن يتجاوز الطلب 100 دج قبل الرسوم.",
          "قد تُستثنى المنتجات الكبيرة أو الحساسة.",
          "لا يجمع مع عروض الشحن الأخرى."
        ],
        title: "الشحن القياسي المجاني"
      },
      intro: "نوفر خيارات توصيل سريعة وموثوقة حتى يصلك طلبك بأمان وفي أسرع وقت ممكن.",
      international: {
        body: "نرسل إلى أكثر من 100 دولة، وتختلف أسعار وأوقات التوصيل الدولي حسب الوجهة.",
        highlight: "للحصول على تقدير أدق، أضف المنتجات إلى السلة وأدخل عنوانك في صفحة الدفع.",
        items: [
          "الرسوم والضرائب الجمركية تقع على عاتق المستلم.",
          "قد تتأخر الشحنات بسبب الإجراءات الجمركية.",
          "بعض المنتجات قد تكون مقيّدة في بعض الدول.",
          "الشحن الدولي غير قابل للتسريع."
        ],
        title: "الشحن الدولي"
      },
      options: {
        headers: ["طريقة التوصيل", "المدة", "التكلفة", "التتبع"],
        rows: [
          ["توصيل قياسي", "5 إلى 7 أيام عمل", "5.99 دج (مجاني فوق 100 دج)", "نعم"],
          ["توصيل سريع", "2 إلى 3 أيام عمل", "12.99 دج", "نعم"],
          ["توصيل لليوم التالي", "يوم عمل واحد", "24.99 دج", "نعم"],
          ["دولي", "7 إلى 21 يوم عمل", "حسب الوجهة", "نعم"]
        ],
        title: "خيارات التوصيل"
      },
      processing: {
        cards: [
          {
            body: "يشحن خلال 1 إلى 2 يوم عمل",
            title: "المنتجات المتوفرة"
          },
          {
            body: "يشحن في أو قبل التاريخ المتوقع",
            title: "الطلبات المسبقة"
          },
          {
            body: "مدة المعالجة تختلف حسب الطلب",
            title: "المنتجات المخصصة"
          },
          {
            body: "تواصل معنا لتحديد الجدول الزمني",
            title: "طلبات الجملة"
          }
        ],
        intro:
          "نعالج جميع الطلبات خلال 1 إلى 2 يوم عمل. الطلبات المسجلة بعد الساعة 14:00 تبدأ معالجتها في يوم العمل التالي.",
        title: "مدة المعالجة"
      },
      restrictions: {
        productRestrictions: [
          "بطاريات الليثيوم تخضع لقيود دولية.",
          "المنتجات الكبيرة قد تتطلب رسوم معالجة إضافية.",
          "المواد الخطرة لا يمكن شحنها.",
          "المنتجات الثقيلة جدًا تحتاج ترتيبات خاصة."
        ],
        shippingRestrictions: [
          "بعض صناديق البريد لا تناسب الشحنات الكبيرة.",
          "بعض العناوين الخاصة تتطلب تنسيقًا مسبقًا.",
          "المناطق البعيدة قد تتطلب رسومًا إضافية.",
          "بعض الوجهات الدولية غير متاحة."
        ],
        title: "قيود الشحن"
      },
      specialServices: {
        cards: [
          {
            body: [
              "موعد توصيل محدد.",
              "تعامل احترافي مع المنتجات الحساسة.",
              "إزالة مواد التغليف عند الحاجة."
            ],
            subtitle: "متاح لبعض المنتجات الكبيرة أو الحساسة",
            title: "توصيل مميز"
          },
          {
            body: [
              "متوفر في بعض نقاط الاستلام.",
              "الاحتفاظ بالطرد لعدة أيام.",
              "قد يلزم إبراز بطاقة هوية."
            ],
            subtitle: "احتفظ بطردك في نقطة استلام مناسبة",
            title: "الاستلام من نقطة التوصيل"
          }
        ],
        title: "خدمات توصيل إضافية"
      },
      title: "معلومات التوصيل",
      tracking: {
        body: "بعد شحن الطلب ستتلقى رقم تتبع. يمكنك متابعة الشحنة من خلال رابط التتبع أو مباشرة عبر شركة التوصيل.",
        includes: [
          "الموقع الحالي للطرد",
          "تاريخ التوصيل المتوقع",
          "تحديثات حالة الشحنة",
          "بيانات شركة التوصيل",
          "إشعارات محاولات التوصيل",
          "إثبات الاستلام عند توفره"
        ],
        title: "تتبع الطلب"
      }
    },
    staticPages: {
      lastUpdated: "آخر تحديث"
    },
    terms: {
      introDatePrefix: "آخر تحديث",
      sections: [
        {
          body: [
            "باستخدام هذا الموقع، فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق عليها، يرجى عدم استخدام الخدمة."
          ],
          title: "1. قبول الشروط"
        },
        {
          body: [
            "يُسمح لك باستخدام محتوى المتجر للاطلاع الشخصي غير التجاري فقط.",
            "لا يجوز لك نسخ المحتوى أو تعديله لأغراض تجارية أو عامة.",
            "لا يجوز محاولة فك أو تحليل أي برنامج موجود على الموقع."
          ],
          title: "2. ترخيص الاستخدام"
        },
        {
          body: [
            "نسعى لتقديم معلومات دقيقة عن المنتجات من حيث الوصف، السعر، والتوفر، لكن قد تحدث فروقات بسيطة أو تحديثات لاحقة."
          ],
          bullets: [
            "قد تختلف ألوان المنتجات حسب الشاشة.",
            "نحتفظ بحق تصحيح أي خطأ في الأسعار أو البيانات.",
            "توافر المنتجات قابل للتغيير دون إشعار مسبق.",
            "قد نفرض حدودًا على بعض الكميات."
          ],
          title: "3. معلومات المنتجات"
        },
        {
          body: [
            "كل الطلبات تخضع للقبول النهائي من طرفنا، وقد يتم رفض أو إلغاء طلب عند وجود خطأ أو نشاط غير اعتيادي."
          ],
          bullets: [
            "الدفع مستحق عند تسجيل الطلب.",
            "نقبل وسائل الدفع المتاحة في المتجر.",
            "الأسعار معروضة بالدينار الجزائري ما لم يُذكر غير ذلك.",
            "قد تنطبق رسوم أو ضرائب إضافية حسب الحالة."
          ],
          title: "4. الطلبات والدفع"
        },
        {
          body: [
            "تختلف مدة وتكلفة التوصيل حسب الوجهة وطريقة الشحن المختارة، ولا نتحمل تأخير شركات التوصيل أو الجمارك."
          ],
          bullets: [
            "شحن قياسي: 5 إلى 7 أيام عمل.",
            "شحن سريع: 2 إلى 3 أيام عمل.",
            "شحن لليوم التالي: يوم عمل واحد.",
            "شحن دولي: 7 إلى 21 يوم عمل."
          ],
          title: "5. الشحن والتوصيل"
        },
        {
          body: [
            "اطلع على صفحة الإرجاع والاستبدال لمزيد من التفاصيل حول الإرجاعات، الاستبدالات، واسترجاع الأموال."
          ],
          title: "6. الإرجاع واسترداد الأموال"
        },
        {
          body: [
            "عند إنشاء حساب، يجب أن تقدم معلومات صحيحة ومحدثة وأن تحافظ على سرية بيانات الدخول الخاصة بك."
          ],
          bullets: [
            "أنت مسؤول عن كل نشاط يتم عبر حسابك.",
            "يجب إشعارنا فورًا بأي استخدام غير مصرح به.",
            "يجب تحديث بيانات الحساب كلما تغيّرت."
          ],
          title: "7. حسابات المستخدمين"
        },
        {
          body: ["لا يجوز استخدام المتجر في أي نشاط غير قانوني أو مسيء."],
          bullets: [
            "انتهاك القوانين أو اللوائح.",
            "الاعتداء على حقوق الملكية الفكرية.",
            "الإساءة أو التهديد أو التمييز تجاه الآخرين.",
            "تقديم معلومات مضللة أو مزيفة."
          ],
          title: "8. الاستخدامات المحظورة"
        },
        {
          body: [
            "لا نتحمل المسؤولية عن أي خسائر غير مباشرة أو خاصة أو تبعية ناتجة عن استخدام الموقع أو عدم القدرة على استخدامه."
          ],
          title: "9. حدود المسؤولية"
        },
        {
          body: [
            "تخضع هذه الشروط لقوانين الجمهورية الجزائرية الديمقراطية الشعبية ويكون الاختصاص القضائي لمحاكم الجزائر."
          ],
          title: "10. القانون المعمول به"
        },
        {
          body: [
            "نحتفظ بحق تعديل هذه الشروط في أي وقت. استمرارك في استخدام الموقع بعد التحديث يعني موافقتك على النسخة الجديدة."
          ],
          title: "11. تعديل الشروط"
        },
        {
          body: [
            "إذا كانت لديك أسئلة حول هذه الشروط، يمكنك التواصل معنا عبر:",
            "البريد: legal@store.com",
            "الهاتف: 1-800-STORE-01",
            "العنوان: 123 Commerce Street, Business City, BC 12345"
          ],
          title: "12. معلومات التواصل"
        }
      ],
      title: "شروط الاستخدام"
    },
    thankYou: {
      body: "تم تسجيل طلبك وهو الآن في انتظار تأكيد فريق العمليات.",
      continueShopping: "متابعة التسوق",
      eyebrow: "تم استلام الطلب",
      title: "شكرًا لطلبك"
    },
    testimonials: {
      title: "ماذا يقول زبائننا"
    },
    privacy: {
      introDatePrefix: "آخر تحديث",
      sections: [
        {
          body: [
            "نجمع المعلومات التي تقدمها لنا مباشرة عند الشراء أو التواصل أو الاشتراك في النشرة البريدية."
          ],
          bullets: [
            "الاسم وبيانات التواصل.",
            "بيانات الشحن والفوترة.",
            "تاريخ الطلبات والتفضيلات.",
            "الرسائل المتبادلة معنا."
          ],
          title: "1. المعلومات التي نجمعها"
        },
        {
          body: ["نستخدم معلوماتك من أجل:"],
          bullets: [
            "معالجة الطلبات وتنفيذها.",
            "تقديم خدمة العملاء.",
            "إرسال تحديثات الطلبات والحساب.",
            "تحسين المنتجات والخدمات.",
            "تخصيص تجربة التسوق.",
            "حماية الموقع ومنع الاحتيال.",
            "الامتثال للالتزامات القانونية."
          ],
          title: "2. كيف نستخدم معلوماتك"
        },
        {
          body: [
            "لا نبيع معلوماتك الشخصية. قد نشاركها فقط مع مزودي خدمات موثوقين أو عندما يتطلب القانون ذلك."
          ],
          bullets: [
            "مزودو الخدمات الذين يساعدوننا على تشغيل المتجر.",
            "الالتزامات القانونية وحماية الحقوق.",
            "عمليات الاندماج أو نقل الأصول.",
            "بموافقتك الصريحة عند الحاجة."
          ],
          title: "3. مشاركة المعلومات"
        },
        {
          body: [
            "نطبق إجراءات تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الفقدان."
          ],
          bullets: [
            "تشفير عند نقل البيانات.",
            "معالجة آمنة للمدفوعات.",
            "مراجعات أمنية دورية.",
            "ضوابط صلاحيات داخلية."
          ],
          title: "4. أمن البيانات"
        },
        {
          body: ["لديك الحق في:"],
          bullets: [
            "الاطلاع على بياناتك وتحديثها.",
            "طلب حذف البيانات حيثما كان ذلك ممكنًا.",
            "إلغاء الاشتراك في الرسائل التسويقية.",
            "طلب نسخة من بياناتك."
          ],
          title: "5. حقوقك"
        },
        {
          body: [
            "نستخدم ملفات تعريف الارتباط والتقنيات المشابهة لتحسين تجربة التصفح، تحليل الزيارات، وتخصيص المحتوى."
          ],
          title: "6. ملفات تعريف الارتباط"
        },
        {
          body: [
            "قد نقوم بتحديث هذه السياسة من وقت لآخر، وسيتم نشر أي تغييرات مهمة على هذه الصفحة."
          ],
          title: "7. تغييرات السياسة"
        },
        {
          body: [
            "إذا كان لديك أي سؤال، تواصل معنا عبر:",
            "البريد: privacy@store.com",
            "الهاتف: 1-800-STORE-01",
            "العنوان: 123 Commerce Street, Business City, BC 12345"
          ],
          title: "8. تواصل معنا"
        }
      ],
      title: "سياسة الخصوصية"
    }
  },
  fr: {
    cart: {
      checkout: "Passer à la commande",
      continueShopping: "Continuer vos achats",
      emptyDescription: "Vous n'avez pas encore ajouté de produits à votre panier.",
      emptyTitle: "Votre panier est vide",
      quantity: "Quantité",
      title: "Panier",
      total: "Total"
    },
    categories: {
      eyebrow: "Le catalogue",
      headlineLines: ["Chaque regard", "a sa monture."],
      lede: "Six familles, du solaire polarisé aux montures pour enfants. Livrées dans les 58 wilayas, toutes en UV400 réel.",
      moreInfo: "Voir la catégorie",
      title: "Acheter par catégorie",
      unit: "catégories",
      viewAll: "Voir tout le catalogue"
    },
    checkout: {
      address: "Adresse",
      addressPlaceholder: "Rue, bâtiment, étage, point de repère...",
      deliveryDetails: "Détails de livraison",
      fullName: "Nom complet",
      fullNamePlaceholder: "Entrez votre nom complet",
      free: "Gratuit",
      homeDelivery: "Livraison à domicile",
      officePickup: "Retrait en bureau",
      orderSummary: "Récapitulatif de la commande",
      phoneNumber: "Numéro de téléphone",
      phonePlaceholder: "Entrez votre numéro de téléphone",
      placeOrder: "Confirmer la commande",
      processing: "Traitement en cours...",
      quantity: "Qté",
      selectWilaya: "Sélectionnez votre wilaya",
      shippingMethod: "Mode de livraison",
      subtotal: "Sous-total",
      title: "Paiement",
      total: "Total",
      wilaya: "Wilaya"
    },
    contact: {
      additionalCards: [
        {
          body: "Parlez directement avec notre équipe du service client pour une aide immédiate.",
          title: "Appelez-nous"
        },
        {
          body: "Envoyez-nous un e-mail et nous vous répondrons dans les 24 heures ouvrées.",
          title: "Support par e-mail"
        },
        {
          body: "Visitez notre boutique et découvrez les produits en personne.",
          title: "Visiter la boutique"
        }
      ],
      intro:
        "Nous serions ravis de vous entendre. Envoyez-nous un message et nous vous répondrons dans les meilleurs délais.",
      messageLabel: "Message *",
      messagePlaceholder: "Décrivez votre demande en détail...",
      phoneLabel: "Numéro de téléphone *",
      reset: "Envoyer un autre message",
      subjectLabel: "Sujet *",
      subjects: [
        { label: "Sélectionnez un sujet", value: "" },
        { label: "Renseignement général", value: "general" },
        { label: "Support commande", value: "order" },
        { label: "Retours et échanges", value: "returns" },
        { label: "Question sur les verres ou la monture", value: "quality" },
        { label: "Question de facturation", value: "billing" },
        { label: "Demande de partenariat", value: "partnership" }
      ],
      submit: "Envoyer le message",
      submitting: "Envoi en cours...",
      successBody: "Merci de nous avoir contactés. Nous vous répondrons sous 24 heures.",
      successTitle: "Message envoyé avec succès",
      title: "Contactez-nous",
      writeMessage: "Envoyez-nous un message"
    },
    faq: {
      contactCta: "Contactez-nous",
      contactDescription:
        "Contactez-nous pour toute question sur la livraison, les commandes en gros ou le choix de la monture adaptée à votre visage.",
      contactTitle: "Besoin d'aide pour votre commande ?",
      intro:
        "Des réponses claires sur la livraison, le paiement et le suivi des commandes pour nos clients à travers l'Algérie.",
      items: [
        {
          answer:
            "Oui, nous livrons dans toutes les wilayas d'Algérie. Les délais varient selon la wilaya et le transporteur, les grandes villes étant généralement desservies plus rapidement.",
          question: "Livrez-vous dans toutes les wilayas d'Algérie ?"
        },
        {
          answer:
            "Oui, le paiement à la livraison reste une option privilégiée par de nombreux clients et nous simplifions au maximum le processus de commande.",
          question: "Puis-je payer à la livraison ?"
        },
        {
          answer:
            "Après avoir passé votre commande, nous pouvons vous contacter pour confirmer vos coordonnées, l'adresse de livraison et la disponibilité des produits.",
          question: "Comment ma commande est-elle confirmée après avoir été passée ?"
        },
        {
          answer:
            "Les délais de livraison dépendent de votre zone géographique, mais une fois la commande confirmée, nous faisons tout notre possible pour l'expédier rapidement.",
          question: "Combien de temps prend habituellement la livraison ?"
        },
        {
          answer:
            "Chaque paire porte un vrai filtre UV400, et chaque monture est contrôlée et ajustée avant l'emballage. Si vous hésitez sur la forme adaptée à votre visage, nous sommes là pour vous guider.",
          question: "Comment savoir que les verres protègent vraiment les yeux ?"
        },
        {
          answer:
            "Contactez-nous dès que possible avec les détails de votre commande et, si possible, une photo du colis pour que nous puissions vous aider rapidement.",
          question: "Que faire si mon colis arrive endommagé ou si la commande est incorrecte ?"
        }
      ],
      title: "Questions avant de commander"
    },
    featuredProducts: {
      title: "Nos meilleurs produits"
    },
    footer: {
      creditConnector: ", avec",
      creditPrefix: "Site développé par",
      copyright: "Tous droits réservés.",
      description:
        "Lunettes de soleil, montures optiques, anti-lumière bleue et lunettes de lecture, choisies pour une vraie protection UV, une fabrication honnête et un prix juste."
    },
    fullScreenMenu: {
      items: [
        { href: "/contact", label: "Contact" },
        { href: "/products", label: "Produits" }
      ],
      location: "Alger, Algérie"
    },
    hero: {
      cta: "Découvrir nos lunettes",
      headingLines: ["Voir le monde", "plus net"]
    },
    navigation: {
      allProducts: {
        body: "Parcourez notre catalogue complet de lunettes.",
        title: "Tous les produits"
      },
      faq: {
        body: "Réponses sur les tailles, la livraison et l'entretien.",
        title: "FAQ"
      },
      featured: {
        body: "La sélection de la saison : nouvelles formes et verres UV400.",
        title: "Nouvelle collection"
      },
      guide: {
        body: "Comment choisir la forme adaptée à votre visage.",
        title: "Guide des montures"
      },
      highlights: [
        {
          body: "Une protection UV complète, pensée pour le soleil algérien.",
          slug: "sunglasses",
          title: "Lunettes de soleil"
        },
        {
          body: "Des verres qui adoucissent la lumière des écrans sur les longues journées.",
          slug: "blue-light",
          title: "Anti-lumière bleue"
        },
        {
          body: "Étuis, cordons et produits d'entretien pour faire durer vos lunettes.",
          slug: "accessories",
          title: "Accessoires"
        }
      ],
      quickLinks: "Liens rapides",
      shop: "Boutique"
    },
    navbar: {
      cartAriaLabel: "Ouvrir le panier"
    },
    orderLookup: {
      confirmation: "Confirmation",
      courierDetails: "Détails du transporteur",
      courierProvider: "Transporteur",
      courierTracking: "Suivi",
      courierTrackingLink: "Ouvrir le suivi du transporteur",
      courierUnassigned: "Non encore attribué",
      emptyState:
        "Une fois que vous aurez saisi une référence de commande valide et votre numéro de téléphone, le récapitulatif apparaîtra ici.",
      emptyTitle: "En attente de recherche",
      error: "Nous n'avons pas trouvé cette commande.",
      exchange: "Échange",
      guestLookup: "Suivi de commande invité",
      intro: "Entrez votre référence de commande et le numéro de téléphone utilisé lors du paiement.",
      loading: "Vérification...",
      lookupAction: "Vérifier la commande",
      lookupFallback: "Chargement du suivi de commande...",
      noTimeline: "Aucun événement public n'est disponible pour le moment.",
      notAssigned: "En attente",
      openTimeline: "Historique",
      orderRef: "Référence de commande",
      payment: "Paiement",
      phoneNumber: "Numéro de téléphone",
      placeholderOrderRef: "ORD-20260316-ABC123",
      placeholderPhone: "0555 00 00 00",
      title: "Suivre une commande",
      total: "Total"
    },
    productCard: {
      addToCart: "Ajouter au panier"
    },
    productDetail: {
      addToCart: "Ajouter au panier",
      buyNow: "Acheter maintenant",
      keyPoints: "Caractéristiques clés",
      notFound: "Produit introuvable",
      quantity: "Quantité",
      redirecting: "Redirection...",
      relatedProducts: "Produits associés",
      reviewsLabel: "avis"
    },
    productOptions: {
      chooseSize: "Choisissez une option",
      save: "Enregistrer"
    },
    productAttributes: {
      frameShape: "Forme de la monture",
      gender: "Coupe",
      frameColor: "Couleur",
      reset: "Effacer les filtres",
      shapes: {
        round: "Ronde",
        square: "Carrée",
        rectangle: "Rectangulaire",
        aviator: "Aviateur",
        "cat-eye": "Œil de chat",
        oval: "Ovale",
        hexagonal: "Hexagonale",
        wayfarer: "Wayfarer"
      },
      genders: {
        men: "Homme",
        women: "Femme",
        unisex: "Mixte",
        kids: "Enfant"
      },
      colors: {
        black: "Noir",
        tortoise: "Écaille",
        gold: "Or",
        silver: "Argent",
        brown: "Marron",
        blue: "Bleu",
        transparent: "Transparent",
        "rose-gold": "Or rose"
      }
    },
    productReviews: {
      approved: "avis approuvé",
      approvedPlural: "avis approuvés",
      averageOutOfFive: "sur 5",
      contentLabel: "Avis",
      contentPlaceholder: "Dites-nous ce que vous avez aimé, comment vous l'avez utilisé ou ce qui vous a marqué.",
      emptyStatePrefix: "Aucun avis approuvé pour",
      emptyStateSuffix: "pour le moment. Soyez le premier à partager votre expérience.",
      intro: "Les avis sont modérés avant d'apparaître dans la boutique.",
      nameLabel: "Nom",
      namePlaceholder: "Votre nom",
      pendingMessage: "Merci. Votre avis a bien été reçu et est en attente d'approbation.",
      ratingLabel: "Note",
      ratingOption: "étoiles",
      submit: "Soumettre l'avis",
      submitting: "Envoi en cours...",
      submissionError: "Nous n'avons pas pu soumettre votre avis pour le moment. Veuillez réessayer.",
      title: "Avis clients",
      writeReview: "Rédiger un avis"
    },
    productsPage: {
      allCategories: "Toutes les catégories",
      allPrices: "Tous les prix",
      category: "Catégorie",
      emptyState: "Aucun produit ne correspond aux filtres sélectionnés.",
      filterButton: "Filtres",
      filterTitle: "Filtres et tri",
      heading: "Nos produits",
      loading: "Chargement des produits...",
      over10000: "Plus de 10 000 DZD",
      priceHigh: "Prix : du plus cher au moins cher",
      priceLow: "Prix : du moins cher au plus cher",
      priceRange: "Gamme de prix",
      rating: "Mieux notés",
      range3000to6000: "3 000 DZD - 6 000 DZD",
      range6000to10000: "6 000 DZD - 10 000 DZD",
      sortBy: "Trier par",
      sortFeatured: "En vedette",
      sortNewest: "Plus récents",
      under3000: "Moins de 3 000 DZD"
    },
    productsSpotlight: {
      browseCategory: "Parcourir la catégorie",
      nextCategory: "Catégorie suivante",
      previousCategory: "Catégorie précédente"
    },
    brandPromise: {
      claims: [
        "Une vraie protection UV400,",
        "des montures qui durent,",
        "et un prix qui a du sens."
      ]
    },
    returns: {
      damagedItems: {
        body: "Si vous recevez un article endommagé ou défectueux, contactez-nous immédiatement. Nous vous aiderons avec un retour gratuit, un remplacement ou la meilleure solution possible.",
        highlight:
          "Important : prenez des photos du produit et de l'emballage avant de le retourner afin que nous puissions améliorer les expéditions futures.",
        title: "Articles endommagés ou défectueux"
      },
      exchange: {
        body: "Nous ne proposons pas encore d'échanges directs. Si vous souhaitez une autre couleur ou un autre modèle, retournez la paire d'origine et passez une nouvelle commande.",
        highlight:
          "Conseil : passez la nouvelle commande en premier si l'article souhaité est disponible, afin de ne pas attendre la fin du retour.",
        title: "Échanges"
      },
      help: {
        body: "Notre équipe du service client est là pour répondre à toutes vos questions relatives aux retours.",
        contact: ["E-mail : returns@store.com", "Téléphone : 1-800-STORE-01"],
        title: "Besoin d'aide ?"
      },
      intro:
        "Nous souhaitons que vous soyez entièrement satisfait de votre achat. Si votre commande ne vous convient pas, nous sommes là pour vous aider.",
      international: {
        items: [
          "Les frais de retour international sont à la charge du client.",
          "Les articles doivent être retournés à notre entrepôt.",
          "Les droits de douane et taxes ne sont pas remboursables.",
          "Le traitement peut prendre de 10 à 14 jours ouvrés."
        ],
        title: "Retours internationaux"
      },
      overview: {
        cards: [
          { title: "Jours pour retourner", value: "30" },
          { title: "Retours gratuits", value: "Gratuit" },
          { title: "Garantie satisfait ou remboursé", value: "100%" }
        ],
        title: "Aperçu de la politique de retour"
      },
      process: {
        steps: [
          {
            body: "Démarrez votre demande depuis votre compte ou contactez-nous pour indiquer l'article que vous souhaitez retourner.",
            title: "Initier le retour"
          },
          {
            body: "Nous vous enverrons les instructions et, si nécessaire, une étiquette de retour.",
            title: "Préparer l'étiquette"
          },
          {
            body: "Emballez soigneusement l'article et déposez-le au point de collecte approprié.",
            title: "Emballer et expédier"
          },
          {
            body: "Une fois le retour vérifié, le remboursement est émis dans les quelques jours ouvrés suivants.",
            title: "Recevoir votre remboursement"
          }
        ],
        title: "Comment retourner un article"
      },
      table: {
        headers: ["Type d'article", "Délai de retour", "Traitement du remboursement"],
        rows: [
          ["Solaires et montures", "30 jours", "5 à 7 jours ouvrés"],
          ["Lunettes de lecture", "30 jours", "5 à 7 jours ouvrés"],
          ["Articles soldés", "14 jours", "5 à 7 jours ouvrés"]
        ],
        title: "Délais de retour"
      },
      title: "Retours et échanges",
      whatCanBeReturned: {
        nonReturnable: [
          "Articles personnalisés ou sur mesure.",
          "Produits d'entretien descellés.",
          "Articles endommagés par une mauvaise utilisation.",
          "Montures sur lesquelles un tiers a monté des verres."
        ],
        returnable: [
          "Articles dans leur état d'origine.",
          "Montures non portées avec leurs étiquettes.",
          "Articles dans leur emballage d'origine.",
          "Coffrets cadeaux complets."
        ],
        title: "Ce qui peut être retourné"
      }
    },
    shipping: {
      deliveryInfo: {
        issues: [
          "Colis marqué comme livré mais non reçu.",
          "Colis endommagé à la réception.",
          "Adresse de livraison incorrecte.",
          "Plusieurs tentatives de livraison infructueuses."
        ],
        requirements: [
          "Une signature peut être requise pour les commandes de grande valeur.",
          "Certains colis standard peuvent être laissés devant la porte.",
          "Les livraisons en appartement peuvent nécessiter l'accès au bâtiment.",
          "Les boîtes postales ne conviennent pas à toutes les expéditions."
        ],
        title: "Informations de livraison"
      },
      freeShipping: {
        body: "Profitez de la livraison standard gratuite pour toute commande supérieure à 100 DZD. La réduction s'applique automatiquement au moment du paiement.",
        items: [
          "Valable pour la livraison standard en Algérie.",
          "Le total de la commande doit dépasser 100 DZD.",
          "Certaines expéditions spéciales peuvent être exclues.",
          "Ne peut pas être combiné avec d'autres promotions de livraison."
        ],
        title: "Livraison standard gratuite"
      },
      intro: "Nous proposons des options d'expédition rapides et fiables pour vous livrer en toute sécurité.",
      international: {
        body: "Nous expédions dans plus de 100 pays. Les tarifs internationaux et les délais de livraison dépendent de la destination.",
        highlight:
          "Pour une estimation plus précise, ajoutez vos produits au panier et saisissez votre adresse lors du paiement.",
        items: [
          "Les droits de douane et taxes sont à la charge du destinataire.",
          "Les délais de livraison peuvent être prolongés par le traitement douanier.",
          "Certains produits peuvent être restreints dans certains pays.",
          "Les expéditions internationales ne peuvent pas toujours être accélérées."
        ],
        title: "Livraison internationale"
      },
      options: {
        headers: ["Mode d'expédition", "Délai estimé", "Coût", "Suivi"],
        rows: [
          ["Livraison standard", "5-7 jours ouvrés", "5,99 DZD (gratuit au-delà de 100 DZD)", "Oui"],
          ["Livraison express", "2-3 jours ouvrés", "12,99 DZD", "Oui"],
          ["Livraison le lendemain", "1 jour ouvré", "24,99 DZD", "Oui"],
          ["International", "7-21 jours ouvrés", "Variable", "Oui"]
        ],
        title: "Options d'expédition"
      },
      processing: {
        cards: [
          { body: "Expédié sous 1 à 2 jours ouvrés", title: "Articles en stock" },
          { body: "Expédié au plus tard à la date estimée", title: "Précommandes" },
          { body: "Délai variable selon le produit", title: "Articles personnalisés" },
          { body: "Contactez-nous pour les délais", title: "Commandes en gros" }
        ],
        intro:
          "Toutes les commandes sont traitées dans un délai de 1 à 2 jours ouvrés. Les commandes passées après 14h sont traitées le jour ouvré suivant.",
        title: "Délai de traitement"
      },
      restrictions: {
        productRestrictions: [
          "Les batteries au lithium sont soumises à des restrictions internationales.",
          "Les articles surdimensionnés peuvent entraîner des frais supplémentaires.",
          "Les matières dangereuses ne peuvent pas être expédiées.",
          "Les articles très lourds nécessitent une manipulation spéciale."
        ],
        shippingRestrictions: [
          "Certaines boîtes postales ne peuvent pas recevoir de grands colis.",
          "Certaines adresses nécessitent une validation préalable.",
          "Les zones reculées peuvent engendrer des frais supplémentaires.",
          "Certaines destinations internationales sont limitées."
        ],
        title: "Restrictions d'expédition"
      },
      specialServices: {
        cards: [
          {
            body: [
              "Créneaux de livraison planifiés.",
              "Manipulation professionnelle pour les articles fragiles.",
              "Retrait des emballages si disponible."
            ],
            subtitle: "Disponible pour certains articles volumineux ou fragiles",
            title: "Livraison premium"
          },
          {
            body: [
              "Disponible dans certains points de retrait.",
              "Le colis peut être conservé plusieurs jours.",
              "Une pièce d'identité peut être requise."
            ],
            subtitle: "Faites tenir votre colis dans un point de retrait pratique",
            title: "Livraison en point de retrait"
          }
        ],
        title: "Services de livraison spéciaux"
      },
      title: "Informations d'expédition",
      tracking: {
        body: "Une fois votre commande expédiée, vous recevrez un numéro de suivi. Vous pouvez suivre votre colis grâce au lien que nous vous envoyons ou directement auprès du transporteur.",
        includes: [
          "Emplacement actuel du colis",
          "Date de livraison estimée",
          "Mises à jour de statut",
          "Informations sur le transporteur",
          "Notifications de tentative de livraison",
          "Preuve de livraison si disponible"
        ],
        title: "Suivi de commande"
      }
    },
    staticPages: {
      lastUpdated: "Dernière mise à jour"
    },
    terms: {
      introDatePrefix: "Dernière mise à jour",
      sections: [
        {
          body: [
            "En accédant à ce site et en l'utilisant, vous acceptez ces conditions d'utilisation. Si vous n'y consentez pas, veuillez ne pas utiliser le service."
          ],
          title: "1. Acceptation des conditions"
        },
        {
          body: [
            "L'accès au contenu du site est accordé pour un usage personnel et non commercial.",
            "Vous ne pouvez pas copier, modifier ou utiliser ce contenu à des fins publiques ou commerciales.",
            "Toute tentative de rétro-ingénierie du logiciel du site est interdite."
          ],
          title: "2. Licence d'utilisation"
        },
        {
          body: [
            "Nous faisons de notre mieux pour présenter des informations exactes sur les produits, les prix et la disponibilité."
          ],
          bullets: [
            "Les couleurs peuvent varier selon votre écran.",
            "Nous pouvons corriger des erreurs de prix ou de description.",
            "La disponibilité des produits peut changer sans préavis.",
            "Des limites de quantité peuvent s'appliquer."
          ],
          title: "3. Informations produits"
        },
        {
          body: [
            "Toutes les commandes sont soumises à une acceptation finale et nous pouvons refuser ou annuler une commande en cas d'erreur ou d'activité suspecte."
          ],
          bullets: [
            "Le paiement est dû au moment de la commande.",
            "Les modes de paiement disponibles sont affichés lors du paiement.",
            "Les prix sont affichés en DZD sauf indication contraire.",
            "Des taxes ou frais supplémentaires peuvent s'appliquer."
          ],
          title: "4. Commandes et paiement"
        },
        {
          body: [
            "Les délais et coûts d'expédition varient selon la destination et le mode choisi. Nous ne sommes pas responsables des retards causés par les transporteurs ou la douane."
          ],
          bullets: [
            "Livraison standard : 5 à 7 jours ouvrés.",
            "Livraison express : 2 à 3 jours ouvrés.",
            "Livraison le lendemain : 1 jour ouvré.",
            "Livraison internationale : 7 à 21 jours ouvrés."
          ],
          title: "5. Expédition et livraison"
        },
        {
          body: [
            "Veuillez consulter notre page Retours et échanges pour les conditions détaillées de retour et de remboursement."
          ],
          title: "6. Retours et remboursements"
        },
        {
          body: [
            "Lors de la création d'un compte, vous devez fournir des informations exactes et garder vos identifiants confidentiels."
          ],
          bullets: [
            "Vous êtes responsable de l'activité sur votre compte.",
            "Vous devez nous signaler tout accès non autorisé.",
            "Vous devez maintenir vos informations à jour."
          ],
          title: "7. Comptes utilisateurs"
        },
        {
          body: ["Vous ne pouvez pas utiliser le service à des fins illégales ou nuisibles."],
          bullets: [
            "Violation des lois ou réglementations.",
            "Atteinte aux droits de propriété intellectuelle.",
            "Harcèlement, menaces ou discrimination.",
            "Soumission d'informations fausses ou trompeuses."
          ],
          title: "8. Utilisations interdites"
        },
        {
          body: [
            "Nous ne sommes pas responsables des dommages indirects, spéciaux ou consécutifs liés à l'utilisation du site."
          ],
          title: "9. Limitation de responsabilité"
        },
        {
          body: [
            "Ces conditions sont régies par la loi algérienne et tout litige relève de la juridiction des tribunaux algériens."
          ],
          title: "10. Droit applicable"
        },
        {
          body: [
            "Nous pouvons modifier ces conditions à tout moment. L'utilisation continue du site signifie que vous acceptez la version mise à jour."
          ],
          title: "11. Modifications des conditions"
        },
        {
          body: [
            "Si vous avez des questions sur ces conditions, contactez-nous à :",
            "E-mail : legal@store.com",
            "Téléphone : 1-800-STORE-01",
            "Adresse : 123 rue du Commerce, Ville d'affaires, BC 12345"
          ],
          title: "12. Coordonnées"
        }
      ],
      title: "Conditions d'utilisation"
    },
    thankYou: {
      body: "Nous avons enregistré votre commande et elle est en attente de confirmation par l'équipe des opérations.",
      continueShopping: "Continuer vos achats",
      eyebrow: "Commande reçue",
      title: "Merci pour votre commande !"
    },
    testimonials: {
      title: "Ce que disent nos clients"
    },
    privacy: {
      introDatePrefix: "Dernière mise à jour",
      sections: [
        {
          body: [
            "Nous collectons les informations que vous fournissez directement lors d'un achat, d'un contact ou d'une inscription à notre newsletter."
          ],
          bullets: [
            "Nom et coordonnées.",
            "Informations de livraison et de facturation.",
            "Historique des commandes et préférences.",
            "Messages échangés avec notre équipe."
          ],
          title: "1. Informations que nous collectons"
        },
        {
          body: ["Nous utilisons vos informations pour :"],
          bullets: [
            "Traiter et exécuter vos commandes.",
            "Fournir un support client.",
            "Envoyer des mises à jour de compte et de commande.",
            "Améliorer nos produits et services.",
            "Personnaliser votre expérience d'achat.",
            "Protéger le site et prévenir les fraudes.",
            "Respecter les obligations légales."
          ],
          title: "2. Comment nous utilisons vos informations"
        },
        {
          body: [
            "Nous ne vendons pas vos données personnelles. Elles ne peuvent être partagées qu'avec des prestataires de confiance ou lorsque la loi l'exige."
          ],
          bullets: [
            "Prestataires qui nous aident à exploiter la boutique.",
            "Obligations légales et protection des droits.",
            "Fusions, acquisitions ou transferts d'actifs.",
            "Avec votre consentement explicite si nécessaire."
          ],
          title: "3. Partage d'informations"
        },
        {
          body: ["Nous appliquons des mesures techniques et organisationnelles raisonnables pour protéger vos données."],
          bullets: [
            "Chiffrement lors de la transmission.",
            "Traitement sécurisé des paiements.",
            "Audits de sécurité réguliers.",
            "Contrôles d'accès internes."
          ],
          title: "4. Sécurité des données"
        },
        {
          body: ["Vous avez le droit de :"],
          bullets: [
            "Accéder à vos informations et les mettre à jour.",
            "Demander la suppression de certaines données.",
            "Vous désabonner des communications marketing.",
            "Demander une copie de vos données."
          ],
          title: "5. Vos droits"
        },
        {
          body: [
            "Nous utilisons des cookies et des technologies similaires pour améliorer la navigation, analyser le trafic et personnaliser certains contenus."
          ],
          title: "6. Cookies et suivi"
        },
        {
          body: [
            "Nous pouvons mettre à jour cette politique de temps en temps. Toute modification importante sera publiée sur cette page."
          ],
          title: "7. Modifications de cette politique"
        },
        {
          body: [
            "Si vous avez des questions, contactez-nous à :",
            "E-mail : privacy@store.com",
            "Téléphone : 1-800-STORE-01",
            "Adresse : 123 rue du Commerce, Ville d'affaires, BC 12345"
          ],
          title: "8. Nous contacter"
        }
      ],
      title: "Politique de confidentialité"
    }
  },
  en: {
    cart: {
      checkout: "Checkout",
      continueShopping: "Continue shopping",
      emptyDescription: "You haven't added any products to your cart yet.",
      emptyTitle: "Your cart is empty",
      quantity: "Quantity",
      title: "Cart",
      total: "Total"
    },
    categories: {
      eyebrow: "The catalogue",
      headlineLines: ["A frame for", "every way of seeing."],
      lede: "Six families, from polarised sun to children's frames. Delivered to all 58 wilayas, every one of them real UV400.",
      moreInfo: "View category",
      title: "Shop by category",
      unit: "categories",
      viewAll: "Browse the full catalogue"
    },
    checkout: {
      address: "Address",
      addressPlaceholder: "Street, building, floor, nearby landmark...",
      deliveryDetails: "Delivery details",
      fullName: "Full name",
      fullNamePlaceholder: "Enter your full name",
      free: "Free",
      homeDelivery: "Home delivery",
      officePickup: "Pick up at the desk",
      orderSummary: "Order summary",
      phoneNumber: "Phone number",
      phonePlaceholder: "Enter your phone number",
      placeOrder: "Confirm order",
      processing: "Sending your order...",
      quantity: "Qty",
      selectWilaya: "Select your wilaya",
      shippingMethod: "Delivery method",
      subtotal: "Subtotal",
      title: "Checkout",
      total: "Total",
      wilaya: "Wilaya"
    },
    contact: {
      additionalCards: [
        {
          body: "Talk to our customer service team directly for immediate help.",
          title: "Call us"
        },
        {
          body: "Email us and we'll reply within 24 working hours.",
          title: "Email support"
        },
        {
          body: "Visit our shop and try the frames on in person.",
          title: "Visit the shop"
        }
      ],
      intro:
        "We'd be glad to hear from you. Send us a message and we'll get back to you as soon as we can.",
      messageLabel: "Message *",
      messagePlaceholder: "Tell us what you need in as much detail as you can...",
      phoneLabel: "Phone number *",
      reset: "Send another message",
      subjectLabel: "Subject *",
      subjects: [
        { label: "Select a subject", value: "" },
        { label: "General enquiry", value: "general" },
        { label: "Order support", value: "order" },
        { label: "Returns and exchanges", value: "returns" },
        { label: "Question about lenses or frames", value: "quality" },
        { label: "Billing question", value: "billing" },
        { label: "Partnership enquiry", value: "partnership" }
      ],
      submit: "Send message",
      submitting: "Sending...",
      successBody: "Thank you for reaching out. We'll reply within 24 hours.",
      successTitle: "Message sent",
      title: "Contact us",
      writeMessage: "Send us a message"
    },
    faq: {
      contactCta: "Contact us",
      contactDescription:
        "Get in touch with any question about delivery, bulk orders, or choosing the right frame for your face.",
      contactTitle: "Need help with your order?",
      intro:
        "Clear answers on delivery, payment, and order tracking for our customers across Algeria.",
      items: [
        {
          answer:
            "Yes, we deliver to every wilaya in Algeria. Timing varies by wilaya and courier route, and the larger cities are usually served faster than remote areas.",
          question: "Do you deliver to every wilaya in Algeria?"
        },
        {
          answer:
            "Yes, cash on delivery is the option most of our customers prefer, and we keep the ordering process as simple as possible.",
          question: "Can I pay on delivery?"
        },
        {
          answer:
            "After you place an order we may call or message you to confirm your details, your address, and product availability so the parcel arrives without a hitch.",
          question: "How is my order confirmed after I place it?"
        },
        {
          answer:
            "Delivery time depends on your area, but once your order is confirmed we do everything we can to ship it quickly.",
          question: "How long does delivery usually take?"
        },
        {
          answer:
            "Every pair carries a real UV400 filter, and each frame is checked and adjusted before it is packed. If you need help choosing a shape for your face, we're here to guide you.",
          question: "How do I know the lenses really protect my eyes?"
        },
        {
          answer:
            "Get in touch as soon as you can with your order details and, if possible, a photo of the parcel. We'll review it quickly and sort out a replacement or refund.",
          question: "What if my parcel arrives damaged or the order is wrong?"
        }
      ],
      title: "Questions before you order"
    },
    featuredProducts: {
      title: "Our best sellers"
    },
    footer: {
      creditConnector: ", with",
      creditPrefix: "Site built by",
      copyright: "All rights reserved.",
      description:
        "Sunglasses, optical frames, blue-light glasses and reading glasses, chosen for real UV protection, honest build quality, and a fair price."
    },
    fullScreenMenu: {
      items: [
        { href: "/contact", label: "Contact" },
        { href: "/products", label: "Products" }
      ],
      location: "Algiers, Algeria"
    },
    hero: {
      cta: "Shop eyewear",
      headingLines: ["See the world", "sharper"]
    },
    navigation: {
      allProducts: {
        body: "Browse our full eyewear catalogue.",
        title: "All products"
      },
      faq: {
        body: "Answers on sizing, delivery, and looking after your pair.",
        title: "FAQ"
      },
      featured: {
        body: "This season's picks: new shapes and UV400 lenses.",
        title: "New collection"
      },
      guide: {
        body: "How to pick the shape that suits your face.",
        title: "Frame guide"
      },
      highlights: [
        {
          body: "Full UV protection, built for the Algerian sun.",
          slug: "sunglasses",
          title: "Sunglasses"
        },
        {
          body: "Lenses that soften screen light through long working days.",
          slug: "blue-light",
          title: "Blue-light glasses"
        },
        {
          body: "Cases, cords, and cleaning kit to make your pair last.",
          slug: "accessories",
          title: "Accessories"
        }
      ],
      quickLinks: "Quick links",
      shop: "Shop"
    },
    navbar: {
      cartAriaLabel: "Open cart"
    },
    orderLookup: {
      confirmation: "Confirmation",
      courierDetails: "Courier details",
      courierProvider: "Courier",
      courierTracking: "Tracking",
      courierTrackingLink: "Open courier tracking",
      courierUnassigned: "Not assigned yet",
      emptyState:
        "Once you enter a valid order reference and your phone number, the summary will appear here.",
      emptyTitle: "Waiting for a search",
      error: "We couldn't find that order.",
      exchange: "Exchange",
      guestLookup: "Guest order tracking",
      intro: "Enter your order reference and the phone number you used at checkout.",
      loading: "Checking...",
      lookupAction: "Check order",
      lookupFallback: "Loading order tracking...",
      noTimeline: "No public events are available yet.",
      notAssigned: "Pending",
      openTimeline: "History",
      orderRef: "Order reference",
      payment: "Payment",
      phoneNumber: "Phone number",
      placeholderOrderRef: "ORD-20260316-ABC123",
      placeholderPhone: "0555 00 00 00",
      title: "Track an order",
      total: "Total"
    },
    productCard: {
      addToCart: "Add to cart"
    },
    productDetail: {
      addToCart: "Add to cart",
      buyNow: "Buy now",
      keyPoints: "Key specifications",
      notFound: "Product not found",
      quantity: "Quantity",
      redirecting: "Redirecting...",
      relatedProducts: "Related products",
      reviewsLabel: "reviews"
    },
    productOptions: {
      chooseSize: "Choose an option",
      save: "Save"
    },
    productAttributes: {
      frameShape: "Frame shape",
      gender: "Fit",
      frameColor: "Colour",
      reset: "Clear filters",
      shapes: {
        round: "Round",
        square: "Square",
        rectangle: "Rectangle",
        aviator: "Aviator",
        "cat-eye": "Cat-eye",
        oval: "Oval",
        hexagonal: "Hexagonal",
        wayfarer: "Wayfarer"
      },
      genders: {
        men: "Men",
        women: "Women",
        unisex: "Unisex",
        kids: "Kids"
      },
      colors: {
        black: "Black",
        tortoise: "Tortoise",
        gold: "Gold",
        silver: "Silver",
        brown: "Brown",
        blue: "Blue",
        transparent: "Clear",
        "rose-gold": "Rose gold"
      }
    },
    productReviews: {
      approved: "approved review",
      approvedPlural: "approved reviews",
      averageOutOfFive: "out of 5",
      contentLabel: "Review",
      contentPlaceholder: "Tell us how they fit, how you wear them, or what stood out.",
      emptyStatePrefix: "No approved reviews for",
      emptyStateSuffix: "yet. Be the first to share your experience.",
      intro: "Reviews are moderated before they appear in the shop.",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      pendingMessage: "Thank you. We've received your review and it's awaiting approval.",
      ratingLabel: "Rating",
      ratingOption: "stars",
      submit: "Submit review",
      submitting: "Sending...",
      submissionError: "We couldn't submit your review right now. Please try again.",
      title: "Customer reviews",
      writeReview: "Write a review"
    },
    productsPage: {
      allCategories: "All categories",
      allPrices: "All prices",
      category: "Category",
      emptyState: "No products match the selected filters.",
      filterButton: "Filters",
      filterTitle: "Filters and sorting",
      heading: "Our products",
      loading: "Loading products...",
      over10000: "Over 10,000 DZD",
      priceHigh: "Price: high to low",
      priceLow: "Price: low to high",
      priceRange: "Price range",
      rating: "Top rated",
      range3000to6000: "3,000 - 6,000 DZD",
      range6000to10000: "6,000 - 10,000 DZD",
      sortBy: "Sort by",
      sortFeatured: "Featured",
      sortNewest: "Newest",
      under3000: "Under 3,000 DZD"
    },
    productsSpotlight: {
      browseCategory: "Browse category",
      nextCategory: "Next category",
      previousCategory: "Previous category"
    },
    brandPromise: {
      claims: [
        "Real UV400 protection,",
        "frames built to last,",
        "and a price that makes sense."
      ]
    },
    returns: {
      damagedItems: {
        body: "If a pair arrives damaged or faulty, contact us straight away. We'll arrange a free return, a replacement, or whatever solution works best for you.",
        highlight:
          "Important: photograph the frame and the packaging before sending it back, so we can improve how future orders are shipped.",
        title: "Damaged or faulty items"
      },
      exchange: {
        body: "We don't offer direct exchanges yet. If you'd prefer a different colour or another model, return the original pair and place a new order.",
        highlight:
          "Tip: place the new order first if the pair you want is in stock, so you don't have to wait for the return to complete.",
        title: "Exchanges"
      },
      help: {
        body: "Our customer service team is here for any question about returns.",
        contact: ["Email: returns@store.com", "Phone: 1-800-STORE-01"],
        title: "Need help?"
      },
      intro:
        "We want you to be completely happy with your purchase. If your order isn't right for you, we're here to help.",
      international: {
        items: [
          "Return shipping costs for international orders are paid by the customer.",
          "Items must be returned to our warehouse.",
          "Customs duties and taxes are not refundable.",
          "Processing can take 10 to 14 working days."
        ],
        title: "International returns"
      },
      overview: {
        cards: [
          { title: "Days to return", value: "30" },
          { title: "Free returns", value: "Free" },
          { title: "Satisfaction guarantee", value: "100%" }
        ],
        title: "Return policy at a glance"
      },
      process: {
        steps: [
          {
            body: "Start your request from your account or contact us to tell us which item you'd like to return.",
            title: "Start the return"
          },
          {
            body: "We'll send you the instructions and, where needed, a return label.",
            title: "Get your label"
          },
          {
            body: "Pack the item carefully and drop it off at the right collection point.",
            title: "Pack and ship"
          },
          {
            body: "Once the return is checked, your refund is issued within a few working days.",
            title: "Get your refund"
          }
        ],
        title: "How to return an item"
      },
      table: {
        headers: ["Item type", "Return window", "Refund processing"],
        rows: [
          ["Sunglasses and frames", "30 days", "5 to 7 working days"],
          ["Reading glasses", "30 days", "5 to 7 working days"],
          ["Sale items", "14 days", "5 to 7 working days"]
        ],
        title: "Return windows"
      },
      title: "Returns and exchanges",
      whatCanBeReturned: {
        nonReturnable: [
          "Custom or made-to-order items.",
          "Cleaning products once the seal is broken.",
          "Items damaged by misuse.",
          "Frames that have had lenses fitted by a third party."
        ],
        returnable: [
          "Items in their original condition.",
          "Unworn frames with the tags still attached.",
          "Items in their original packaging.",
          "Complete gift sets."
        ],
        title: "What can be returned"
      }
    },
    shipping: {
      deliveryInfo: {
        issues: [
          "Parcel marked delivered but not received.",
          "Parcel damaged on arrival.",
          "Incorrect delivery address.",
          "Several failed delivery attempts."
        ],
        requirements: [
          "A signature may be required for high-value orders.",
          "Some standard parcels may be left at the door.",
          "Apartment deliveries may require building access.",
          "PO boxes aren't suitable for every shipment."
        ],
        title: "Delivery information"
      },
      freeShipping: {
        body: "Enjoy free standard delivery on every order over 100 DZD. The discount is applied automatically at checkout.",
        items: [
          "Valid for standard delivery within Algeria.",
          "The order total must exceed 100 DZD.",
          "Some special shipments may be excluded.",
          "Cannot be combined with other delivery promotions."
        ],
        title: "Free standard delivery"
      },
      intro: "We offer fast, reliable shipping options to get your order to you safely.",
      international: {
        body: "We ship to over 100 countries. International rates and delivery times depend on the destination.",
        highlight:
          "For a more accurate estimate, add your products to the cart and enter your address at checkout.",
        items: [
          "Customs duties and taxes are paid by the recipient.",
          "Delivery times may be extended by customs processing.",
          "Some products may be restricted in certain countries.",
          "International shipments cannot always be expedited."
        ],
        title: "International shipping"
      },
      options: {
        headers: ["Shipping method", "Estimated time", "Cost", "Tracking"],
        rows: [
          ["Standard delivery", "5-7 working days", "5.99 DZD (free over 100 DZD)", "Yes"],
          ["Express delivery", "2-3 working days", "12.99 DZD", "Yes"],
          ["Next-day delivery", "1 working day", "24.99 DZD", "Yes"],
          ["International", "7-21 working days", "Varies", "Yes"]
        ],
        title: "Shipping options"
      },
      processing: {
        cards: [
          { body: "Shipped within 1 to 2 working days", title: "In-stock items" },
          { body: "Shipped by the estimated date at the latest", title: "Pre-orders" },
          { body: "Timing varies by product", title: "Custom items" },
          { body: "Contact us for lead times", title: "Bulk orders" }
        ],
        intro:
          "All orders are processed within 1 to 2 working days. Orders placed after 2pm are processed the next working day.",
        title: "Processing time"
      },
      restrictions: {
        productRestrictions: [
          "Lithium batteries are subject to international restrictions.",
          "Oversized items may incur additional charges.",
          "Hazardous materials cannot be shipped.",
          "Very heavy items require special handling."
        ],
        shippingRestrictions: [
          "Some PO boxes cannot receive large parcels.",
          "Some addresses require prior validation.",
          "Remote areas may incur additional charges.",
          "Some international destinations are limited."
        ],
        title: "Shipping restrictions"
      },
      specialServices: {
        cards: [
          {
            body: [
              "Scheduled delivery slots.",
              "Professional handling for fragile items.",
              "Packaging removal where available."
            ],
            subtitle: "Available for selected bulky or fragile items",
            title: "Premium delivery"
          },
          {
            body: [
              "Available at selected pickup points.",
              "The parcel can be held for several days.",
              "Photo ID may be required."
            ],
            subtitle: "Have your parcel held at a convenient pickup point",
            title: "Pickup point delivery"
          }
        ],
        title: "Special delivery services"
      },
      title: "Shipping information",
      tracking: {
        body: "Once your order ships, you'll receive a tracking number. You can follow your parcel through the link we send you or directly with the courier.",
        includes: [
          "Current parcel location",
          "Estimated delivery date",
          "Status updates",
          "Courier information",
          "Delivery attempt notifications",
          "Proof of delivery where available"
        ],
        title: "Order tracking"
      }
    },
    staticPages: {
      lastUpdated: "Last updated"
    },
    terms: {
      introDatePrefix: "Last updated",
      sections: [
        {
          body: [
            "By accessing and using this site, you accept these terms of use. If you don't agree with them, please don't use the service."
          ],
          title: "1. Acceptance of terms"
        },
        {
          body: [
            "Access to the site's content is granted for personal, non-commercial use.",
            "You may not copy, modify, or use this content for public or commercial purposes.",
            "Any attempt to reverse-engineer the site's software is prohibited."
          ],
          title: "2. Licence of use"
        },
        {
          body: [
            "We do our best to present accurate information about our products, prices, and availability."
          ],
          bullets: [
            "Colours may vary depending on your screen.",
            "We may correct pricing or description errors.",
            "Product availability may change without notice.",
            "Quantity limits may apply."
          ],
          title: "3. Product information"
        },
        {
          body: [
            "All orders are subject to final acceptance, and we may refuse or cancel an order in the event of an error or suspicious activity."
          ],
          bullets: [
            "Payment is due at the time of the order.",
            "Available payment methods are shown at checkout.",
            "Prices are displayed in DZD unless stated otherwise.",
            "Additional taxes or fees may apply."
          ],
          title: "4. Orders and payment"
        },
        {
          body: [
            "Shipping times and costs vary by destination and the method chosen. We are not responsible for delays caused by couriers or customs."
          ],
          bullets: [
            "Standard delivery: 5 to 7 working days.",
            "Express delivery: 2 to 3 working days.",
            "Next-day delivery: 1 working day.",
            "International delivery: 7 to 21 working days."
          ],
          title: "5. Shipping and delivery"
        },
        {
          body: [
            "Please see our Returns and exchanges page for the full return and refund conditions."
          ],
          title: "6. Returns and refunds"
        },
        {
          body: [
            "When creating an account, you must provide accurate information and keep your credentials confidential."
          ],
          bullets: [
            "You are responsible for activity on your account.",
            "You must report any unauthorised access to us.",
            "You must keep your information up to date."
          ],
          title: "7. User accounts"
        },
        {
          body: ["You may not use the service for illegal or harmful purposes."],
          bullets: [
            "Breaking laws or regulations.",
            "Infringing intellectual property rights.",
            "Harassment, threats, or discrimination.",
            "Submitting false or misleading information."
          ],
          title: "8. Prohibited uses"
        },
        {
          body: [
            "We are not liable for indirect, special, or consequential damages arising from use of the site."
          ],
          title: "9. Limitation of liability"
        },
        {
          body: [
            "These terms are governed by Algerian law, and any dispute falls under the jurisdiction of the Algerian courts."
          ],
          title: "10. Governing law"
        },
        {
          body: [
            "We may change these terms at any time. Continued use of the site means you accept the updated version."
          ],
          title: "11. Changes to the terms"
        },
        {
          body: [
            "If you have questions about these terms, contact us at:",
            "Email: legal@store.com",
            "Phone: 1-800-STORE-01",
            "Address: 123 Commerce Street, Business City, BC 12345"
          ],
          title: "12. Contact details"
        }
      ],
      title: "Terms of use"
    },
    thankYou: {
      body: "We've recorded your order and it's waiting for confirmation by our operations team.",
      continueShopping: "Continue shopping",
      eyebrow: "Order received",
      title: "Thank you for your order!"
    },
    testimonials: {
      title: "What our customers say"
    },
    privacy: {
      introDatePrefix: "Last updated",
      sections: [
        {
          body: [
            "We collect the information you provide directly when you make a purchase, contact us, or sign up to our newsletter."
          ],
          bullets: [
            "Name and contact details.",
            "Delivery and billing information.",
            "Order history and preferences.",
            "Messages exchanged with our team."
          ],
          title: "1. Information we collect"
        },
        {
          body: ["We use your information to:"],
          bullets: [
            "Process and fulfil your orders.",
            "Provide customer support.",
            "Send account and order updates.",
            "Improve our products and services.",
            "Personalise your shopping experience.",
            "Protect the site and prevent fraud.",
            "Meet our legal obligations."
          ],
          title: "2. How we use your information"
        },
        {
          body: [
            "We don't sell your personal data. It may only be shared with trusted providers or where the law requires it."
          ],
          bullets: [
            "Providers who help us run the shop.",
            "Legal obligations and protection of rights.",
            "Mergers, acquisitions, or asset transfers.",
            "With your explicit consent where needed."
          ],
          title: "3. Sharing information"
        },
        {
          body: ["We apply reasonable technical and organisational measures to protect your data."],
          bullets: [
            "Encryption in transit.",
            "Secure payment processing.",
            "Regular security audits.",
            "Internal access controls."
          ],
          title: "4. Data security"
        },
        {
          body: ["You have the right to:"],
          bullets: [
            "Access and update your information.",
            "Request deletion of certain data.",
            "Unsubscribe from marketing messages.",
            "Request a copy of your data."
          ],
          title: "5. Your rights"
        },
        {
          body: [
            "We use cookies and similar technologies to improve browsing, analyse traffic, and personalise some content."
          ],
          title: "6. Cookies and tracking"
        },
        {
          body: [
            "We may update this policy from time to time. Any significant change will be published on this page."
          ],
          title: "7. Changes to this policy"
        },
        {
          body: [
            "If you have any questions, contact us at:",
            "Email: privacy@store.com",
            "Phone: 1-800-STORE-01",
            "Address: 123 Commerce Street, Business City, BC 12345"
          ],
          title: "8. Contact us"
        }
      ],
      title: "Privacy policy"
    }
  }
} as const;

export const getStorefrontCopy = (language: StorefrontLanguage) => STOREFRONT_COPY[language];
