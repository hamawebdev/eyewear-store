"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface BurgerMenuProps {
    isOpen: boolean;
    onToggle: () => void;
}

const LINE_REST_COLOR = "#1e293b"; // slate-800, on the white pill
const LINE_ACTIVE_COLOR = "#ffffff"; // on the expanded primary circle
const CIRCLE_SIZE = "2.5rem"; // 40px inside the 50px button
const LINE_OFFSET = 3.5; // half the resting gap between the two lines

export function BurgerMenu({ isOpen, onToggle }: BurgerMenuProps) {
    const circleRef = useRef<HTMLDivElement>(null);
    const line1Ref = useRef<HTMLSpanElement>(null);
    const line2Ref = useRef<HTMLSpanElement>(null);
    const isHoveredRef = useRef(false);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        // Resting state: bare hamburger on white, circle collapsed out of sight
        if (circleRef.current) {
            gsap.set(circleRef.current, { width: 0, height: 0 });
        }
        if (line1Ref.current && line2Ref.current) {
            gsap.set([line1Ref.current, line2Ref.current], {
                rotation: 0,
                y: 0,
                backgroundColor: LINE_REST_COLOR,
            });
        }
    }, []);

    // Expand/collapse the primary circle behind the lines, recolouring them to suit
    const setCircleExpanded = (expanded: boolean, delay = 0) => {
        if (circleRef.current) {
            gsap.to(circleRef.current, {
                width: expanded ? CIRCLE_SIZE : 0,
                height: expanded ? CIRCLE_SIZE : 0,
                duration: 0.45,
                delay,
                ease: "power3.inOut",
            });
        }
        if (line1Ref.current && line2Ref.current) {
            gsap.to([line1Ref.current, line2Ref.current], {
                backgroundColor: expanded ? LINE_ACTIVE_COLOR : LINE_REST_COLOR,
                duration: 0.3,
                delay,
                ease: "power2.out",
            });
        }
    };

    // Handle menu open/close animations
    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        gsap.killTweensOf([circleRef.current, line1Ref.current, line2Ref.current]);

        if (isOpen) {
            animateToX();
        } else {
            animateToBurger();
        }
    }, [isOpen]);

    const animateToX = () => {
        setCircleExpanded(true);

        // Converge the two lines on the centre, then cross them
        gsap.to(line1Ref.current, {
            rotation: 45,
            y: LINE_OFFSET,
            duration: 0.45,
            delay: 0.15,
            ease: "power3.inOut",
        });
        gsap.to(line2Ref.current, {
            rotation: -45,
            y: -LINE_OFFSET,
            duration: 0.45,
            delay: 0.15,
            ease: "power3.inOut",
        });
    };

    const animateToBurger = () => {
        gsap.to([line1Ref.current, line2Ref.current], {
            rotation: 0,
            y: 0,
            duration: 0.4,
            ease: "power3.inOut",
        });

        // Keep the circle up if the pointer is still resting on the button
        if (!isHoveredRef.current) {
            setCircleExpanded(false, 0.2);
        }
    };

    const handleMouseEnter = () => {
        isHoveredRef.current = true;
        if (isOpen) return; // Already expanded while the menu is open
        setCircleExpanded(true);
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        if (isOpen) return; // Stay expanded until the menu closes
        setCircleExpanded(false);
    };

    return (
        <button
            onClick={onToggle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="pointer-events-auto relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_4px_24px_rgb(0,0,0,0.12)] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Menu"
            aria-expanded={isOpen}
        >
            {/* Circle that grows behind the lines on hover / while open */}
            <div
                ref={circleRef}
                className="bg-primary pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 0, height: 0 }}
            />

            {/* Hamburger lines — morph into an X when the menu opens */}
            <span className="pointer-events-none relative flex flex-col items-center justify-center gap-[5px]">
                <span
                    ref={line1Ref}
                    className="block rounded-full"
                    style={{
                        width: "1.125rem",
                        height: "2px",
                        backgroundColor: LINE_REST_COLOR,
                    }}
                />
                <span
                    ref={line2Ref}
                    className="block rounded-full"
                    style={{
                        width: "1.125rem",
                        height: "2px",
                        backgroundColor: LINE_REST_COLOR,
                    }}
                />
            </span>
        </button>
    );
}
