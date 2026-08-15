export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square animate-pulse rounded-xl bg-stone-100" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-stone-100" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 h-9 w-3/4 animate-pulse rounded bg-stone-100" />
            <div className="mb-4 flex items-center gap-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-5 w-5 animate-pulse rounded bg-stone-100" />
                ))}
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-stone-100" />
            </div>
            <div className="h-9 w-1/4 animate-pulse rounded bg-stone-100" />
          </div>

          <div className="h-16 w-full animate-pulse rounded bg-stone-100" />

          {/* Options Skeleton */}
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 w-28 animate-pulse rounded-lg bg-stone-100" />
            ))}
          </div>

          {/* Quantity Skeleton */}
          <div>
            <div className="mb-3 h-5 w-20 animate-pulse rounded bg-stone-100" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-stone-100" />
              <div className="h-6 w-12 animate-pulse rounded bg-stone-100" />
              <div className="h-10 w-10 animate-pulse rounded-lg bg-stone-100" />
            </div>
          </div>

          {/* Buttons Skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-14 w-full animate-pulse rounded-md bg-stone-100 sm:flex-1" />
            <div className="h-14 w-full animate-pulse rounded-md bg-stone-200 sm:flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
