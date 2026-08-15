"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { Rating } from "@/components/shadcnblocks/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Review {
  id: string;
  rating: number;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  date: string;
  verified?: boolean;
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: "1",
    rating: 5,
    content: "This is the second time I've bought from you. Thank you so much.",
    author: {
      name: "fatehbaeea",
    },
    date: "21/06/2025",
    verified: false,
  },
  {
    id: "2",
    rating: 5,
    content:
      "I usually do not trust people easily, but Eden truly earns your trust through their kind service, fast replies, guarantees, and overall professionalism. This is not my first time dealing with them, and God willing it will not be the last. I recommend them to anyone looking for the services they offer. Best of luck.",
    author: {
      name: "Sif Eddine",
    },
    date: "27/06/2025",
    verified: true,
  },
  {
    id: "3",
    rating: 5,
    content: "Fast and trustworthy. Bless you.",
    author: {
      name: "Mostafa dje",
    },
    date: "29/06/2025",
    verified: true,
  },
  {
    id: "4",
    rating: 5,
    content:
      "We will definitely work together again, God willing. Trustworthy and reliable service. Thank you very much.",
    author: {
      name: "Nasreddine",
    },
    date: "01/07/2025",
    verified: true,
  },
  {
    id: "5",
    rating: 5,
    content: "The best.",
    author: {
      name: "zineddine",
    },
    date: "02/07/2025",
    verified: true,
  },
  {
    id: "6",
    rating: 5,
    content: "The most trustworthy and reliable in the field, including the prices.",
    author: {
      name: "Mohamed",
    },
    date: "05/07/2025",
    verified: true,
  },
  {
    id: "7",
    rating: 5,
    content: "Thank you very much for your service.",
    author: {
      name: "CARLOSLEVRAI",
    },
    date: "06/07/2025",
    verified: false,
  },
  {
    id: "8",
    rating: 5,
    content: "Honest and trustworthy. Thank you.",
    author: {
      name: "Aymene Moulai",
    },
    date: "08/07/2025",
    verified: true,
  },
  {
    id: "9",
    rating: 5,
    content: "No comment, just appreciation.",
    author: {
      name: "Younes ismail",
    },
    date: "10/07/2025",
    verified: false,
  },
  {
    id: "10",
    rating: 5,
    content: "Honest and trustworthy, God bless.",
    author: {
      name: "Younes ismail",
    },
    date: "10/07/2025",
    verified: true,
  },
  {
    id: "11",
    rating: 5,
    content:
      "Professional service, a responsive team, clear instructions, and an easy subscription process. Excellent, and wishing you continued success.",
    author: {
      name: "Nazim",
    },
    date: "14/07/2025",
    verified: false,
  },
  {
    id: "12",
    rating: 5,
    content: "A top-notch team. Honestly, thank you very much.",
    author: {
      name: "khouas nabil",
    },
    date: "18/07/2025",
    verified: true,
  },
  {
    id: "13",
    rating: 5,
    content: "Perfect people to work with, honest and trustworthy. Good luck, guys.",
    author: {
      name: "Dawn Design",
    },
    date: "21/07/2025",
    verified: true,
  },
  {
    id: "14",
    rating: 5,
    content: "Very good service. I hope it always stays this way. Keep it up.",
    author: {
      name: "Rami",
    },
    date: "26/07/2025",
    verified: true,
  },
  {
    id: "15",
    rating: 5,
    content: "It is my first time buying from them. Very fast service, God bless.",
    author: {
      name: "Mohamed",
    },
    date: "28/07/2025",
    verified: true,
  },
  {
    id: "16",
    rating: 5,
    content:
      "- Fast response\n- Good price\n- Easy subscription setup\n- The product was exactly as described by the seller\n\nTrust earned.",
    author: {
      name: "Mirai che",
    },
    date: "01/08/2025",
    verified: true,
  },
  {
    id: "17",
    rating: 5,
    content: "Top-tier service and very trustworthy to deal with.",
    author: {
      name: "Rabah",
    },
    date: "23/08/2025",
    verified: true,
  },
  {
    id: "18",
    rating: 5,
    content: "Very nice.",
    author: {
      name: "AMJID ZAOUI",
    },
    date: "20/09/2025",
    verified: false,
  },
  {
    id: "19",
    rating: 5,
    content: "Trust earned. Good luck, guys.",
    author: {
      name: "yasserjl51",
    },
    date: "02/10/2025",
    verified: true,
  },
  {
    id: "20",
    rating: 4,
    content: "Great",
    author: {
      name: "Austen",
    },
    date: "14/10/2025",
    verified: false,
  },
  {
    id: "21",
    rating: 5,
    content: "Thanks",
    author: {
      name: "Hichem Yahia",
    },
    date: "17/10/2025",
    verified: false,
  },
  {
    id: "22",
    rating: 5,
    content:
      "May God bless you for the service. The support team works smoothly, the service is reliable, and the treatment is respectful. To be honest, they forgot to cancel the activation for an extra month and refused to let me pay for it.\n\nI will gladly deal with you again in the future if I need any software.",
    author: {
      name: "M.BOUCIF",
    },
    date: "28/10/2025",
    verified: true,
  },
  {
    id: "23",
    rating: 5,
    content: "Fast, professional, and trustworthy. God bless.",
    author: {
      name: "Reguieg abderrahmane",
    },
    date: "10/11/2025",
    verified: true,
  },
];

interface Reviews1Props {
  reviews?: Review[];
  title?: string;
  className?: string;
}

const Reviews1 = ({
  reviews = DEFAULT_REVIEWS,
  title = "Customer Reviews",
  className,
}: Reviews1Props) => {
  const [currentReviews, setCurrentReviews] = useState<Review[]>(reviews);
  const [newReview, setNewReview] = useState({
    rating: 5,
    content: "",
    name: "",
  });

  const averageRating =
    currentReviews.reduce((sum, review) => sum + review.rating, 0) / currentReviews.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.content || !newReview.name) return;

    const addedReview: Review = {
      id: Math.random().toString(36).substring(7),
      rating: newReview.rating,
      content: newReview.content,
      author: {
        name: newReview.name,
      },
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      verified: true // Marking self-submitted as verified for demo
    };

    setCurrentReviews((prev) => [...prev, addedReview]);
    setNewReview({ rating: 5, content: "", name: "" }); // Reset
  };

  return (
    <section dir="ltr" className={cn("py-16 md:py-24 text-left", className)}>
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="from-foreground to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h2>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Rating rate={averageRating} className="[&_svg]:size-5" />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} out of 5 · {currentReviews.length} reviews
            </span>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-0">
          {currentReviews.map((review, index) => (
            <div key={review.id}>
              {index > 0 && <Separator className="my-6" />}
              <div className="space-y-3">
                {/* Rating & Title */}
                <div>
                  <Rating rate={review.rating} className="[&_svg]:size-4" />
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.content}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={review.author.avatar}
                      alt={review.author.name}
                    />
                    <AvatarFallback className="text-xs">
                      {review.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{review.author.name}</span>

                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{review.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Review Form */}
        <div className="mt-12 rounded-xl bg-gray-50 p-6 border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="mb-4 text-xl font-semibold">Write a review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <select
                id="rating"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating !== 1 && "s"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Review</Label>
              <Textarea
                id="content"
                placeholder="Write your review here..."
                value={newReview.content}
                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                required
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit">Soumettre l'avis</Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export { Reviews1 };
