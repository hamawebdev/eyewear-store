"use client";

import React from "react";
import Link from "next/link";
import { useStorefrontLanguage } from "@/components/storefront-language-provider";
import { BRAND } from "@/lib/brand";
import { getStorefrontCopy } from "@/lib/storefront-copy";

interface FullScreenMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FullScreenMenu({ isOpen, onClose }: FullScreenMenuProps) {
    const { direction, language } = useStorefrontLanguage();
    const copy = getStorefrontCopy(language);

    return (
        <div
            className="fullscreen-menu-overlay fixed inset-0 flex-col items-center justify-center"
            style={{
                backgroundColor: "hsl(0 0% 100%)",
                zIndex: 100,
            }}
            dir={direction}
            data-open={isOpen || undefined}
            aria-hidden={!isOpen}
        >
            <nav className="w-full max-w-4xl px-8">
                <ul className="flex flex-col gap-6 md:gap-8 list-none m-0 p-0">
                    {copy.fullScreenMenu.items.map((item, index) => (
                        <li
                            key={index}
                            className="fullscreen-menu-item text-center"
                        >
                            <Link
                                href={item.href}
                                className="block transition-opacity duration-200 hover:opacity-70"
                                tabIndex={isOpen ? 0 : -1}
                                onClick={onClose}
                                style={{
                                    color: "hsl(191 79% 43%)",
                                    fontSize: "clamp(40px, 8vw, 80px)",
                                    fontWeight: 700,
                                    letterSpacing: "-0.04em",
                                    lineHeight: 1.2,
                                    textDecoration: "none",
                                    WebkitFontSmoothing: "antialiased",
                                }}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer info */}
            <div
                className="absolute bottom-12 left-0 right-0 flex justify-center gap-8 px-8"
                style={{
                    color: "hsl(191 79% 43%)",
                    fontSize: "clamp(12px, 2vw, 16px)",
                    fontWeight: 700,
                    opacity: 0.7,
                }}
            >
                <span>{copy.fullScreenMenu.location}</span>
                {BRAND.email ? (
                    <>
                        <span>&bull;</span>
                        <span>{BRAND.email}</span>
                    </>
                ) : null}
            </div>
        </div>
    );
}
