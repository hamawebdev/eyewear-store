export const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Graphic Designer",
    content:
      "I wear the blue-light pair from nine to six and the end-of-day headaches are gone. Light enough that I forget they're on.",
    rating: 5,
    avatar: "/placeholder.svg"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Cycling Club Organiser",
    content:
      "Fast shipping, solid build, and honest value. The polarised sport pair cuts road glare without darkening everything.",
    rating: 5,
    avatar: "/placeholder.svg"
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Librarian",
    content:
      "From readers to sunglasses, the range is well chosen and clearly labelled. The strengths were exactly as described.",
    rating: 5,
    avatar: "/placeholder.svg"
  }
] as const;

export type Testimonial = (typeof testimonials)[number];
