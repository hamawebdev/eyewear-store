"use client";

import React, { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { getStorefrontCopy } from "@/lib/storefront-copy";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

type AvatarVariant = "man" | "woman";

function createAvatarDataUri({
  variant,
  background,
  shirt,
  hair
}: {
  variant: AvatarVariant;
  background: string;
  shirt: string;
  hair: string;
}) {
  const hairShape =
    variant === "woman"
      ? `
        <path d="M18 28C18 16 24 10 32 10C40 10 46 16 46 28V43H18V28Z" fill="${hair}" opacity="0.92" />
        <path d="M21 24C23 17 27 14 32 14C38 14 42 18 43 24C39 21 36 20 32 20C28 20 24 21 21 24Z" fill="${hair}" />
      `
      : `
        <path d="M20 24C20 16 25 11 32 11C39 11 44 16 44 24V27C40 24 36 23 32 23C28 23 24 24 20 27V24Z" fill="${hair}" />
      `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="32" fill="${background}" />
      ${hairShape}
      <circle cx="32" cy="27" r="11" fill="#F5D1B2" />
      <path d="M16 57C18.5 47.5 24.5 42 32 42C39.5 42 45.5 47.5 48 57H16Z" fill="${shirt}" />
      <path d="M27 31.5C28.8 33.2 35.2 33.2 37 31.5" stroke="#9A5B47" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="27.5" cy="27.5" r="1.2" fill="#2F2A28" />
      <circle cx="36.5" cy="27.5" r="1.2" fill="#2F2A28" />
    </svg>
  `)}`;
}

const defaultTestimonials = [
  {
    text: "Nadara ta3 Herizi khfifa bzzaf 3la lwedjh, nensaha m3a lwe9t. W chems ma3adch tdayeqni fe blasti.",
    imageSrc: createAvatarDataUri({
      variant: "woman",
      background: "#FCE7F3",
      shirt: "#DB2777",
      hair: "#3F2A1D"
    }),
    name: "Samira B.",
    username: "@samira.batna",
    role: "Batna"
  },
  {
    text: "Chrit nadara chemsiya l'dar w kamel 3jabhom. Solide, w les verres ndaf bezaf.",
    imageSrc: createAvatarDataUri({
      variant: "man",
      background: "#DBEAFE",
      shirt: "#2563EB",
      hair: "#2B2B2B"
    }),
    name: "Yacine K.",
    username: "@yacine.setif",
    role: "Setif"
  },
  {
    text: "Khdemt 8 sa3at 9odam l'écran b nadarat anti-lumière bleue, sra7a 3ineya ma3adch t7ergouni fel 3chiya.",
    imageSrc: createAvatarDataUri({
      variant: "woman",
      background: "#FEF3C7",
      shirt: "#D97706",
      hair: "#5B341C"
    }),
    name: "Lina H.",
    username: "@lina.oran",
    role: "Oran"
  },
  {
    text: "L'monture chariti mahich khfifa kima les imitations, tban solide w b qualité. Hada li 3jebni.",
    imageSrc: createAvatarDataUri({
      variant: "man",
      background: "#DCFCE7",
      shirt: "#16A34A",
      hair: "#4A3428"
    }),
    name: "Nabil M.",
    username: "@nabil.blida",
    role: "Blida"
  },
  {
    text: "Nadarat l'9raya wselni b sr3a, w l'force li tlebt kanet mazbouta. Wlit ne9ra bla ma n3ayi.",
    imageSrc: createAvatarDataUri({
      variant: "woman",
      background: "#E0E7FF",
      shirt: "#7C3AED",
      hair: "#231815"
    }),
    name: "Kahina R.",
    username: "@kahina.bjaia",
    role: "Bejaia"
  },
  {
    text: "Commande wsaletni b sr3a w l'étui kan mratab. Rak t7ess beli kayen i3tina fel produit.",
    imageSrc: createAvatarDataUri({
      variant: "man",
      background: "#F3E8FF",
      shirt: "#9333EA",
      hair: "#1F2937"
    }),
    name: "Mehdi T.",
    username: "@mehdi.alger",
    role: "Alger"
  }
];

interface TestimonialProps {
  testimonials?: {
    text: string;
    imageSrc: string;
    name: string;
    username: string;
    role?: string;
  }[];
  title?: string;
  autoplaySpeed?: number;
  className?: string;
}

export default function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  title,
  autoplaySpeed = 3000,
  className
}: TestimonialProps) {
  const { language, direction } = useStorefrontLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: "trimSnaps",
    dragFree: true,
    direction
  });
  const copy = getStorefrontCopy(language);
  const resolvedTitle = title || copy.testimonials.title;

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplaySpeed);

    return () => {
      clearInterval(autoplay);
    };
  }, [emblaApi, autoplaySpeed]);

  const allTestimonials = [...testimonials, ...testimonials];

  return (
    <section className={cn("bg-background relative overflow-hidden py-16 md:py-24", className)}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="bg-primary/5 absolute top-1/4 left-1/4 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mb-12 text-center md:mb-16"
        >
          <h1 className="from-foreground to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
            {resolvedTitle}
          </h1>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {allTestimonials.map((testimonial, index) => (
              <div key={`${testimonial.name}-${index}`} className="flex justify-center px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="border-border from-secondary/20 to-card relative flex h-full min-w-[280px] flex-col sm:min-w-[300px] md:min-w-[320px] w-72 sm:w-80 md:w-96 rounded-2xl border bg-gradient-to-b p-6 shadow-md backdrop-blur-sm"
                >
                  {/* Enhanced decorative gradients */}
                  <div className="from-primary/15 to-card absolute -top-5 -left-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-b blur-md" />
                  <div className="from-primary/10 absolute -right-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-gradient-to-t to-transparent opacity-70 blur-xl" />

                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="text-primary mb-4"
                  >
                    <div className="relative">
                      <Quote className="h-10 w-10 -rotate-180" />
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="text-foreground/90 relative mb-6 text-base leading-relaxed"
                  >
                    <span className="relative">{testimonial.text}</span>
                  </motion.p>

                  {/* Enhanced user info with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="border-border/40 mt-auto flex shrink-0 items-center gap-3 border-t pt-2"
                  >
                    <Avatar className="border-border ring-primary/10 ring-offset-background h-10 w-10 border ring-2 ring-offset-1">
                      <AvatarImage src={testimonial.imageSrc} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="text-foreground font-medium whitespace-nowrap">
                        {testimonial.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-primary/80 text-sm whitespace-nowrap">
                          {testimonial.username}
                        </p>
                        {testimonial.role && (
                          <>
                            <span className="text-muted-foreground flex-shrink-0">•</span>
                            <p className="text-muted-foreground text-sm whitespace-nowrap">
                              {testimonial.role}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
