export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      {/* Category Spotlight Skeleton */}
      <div className="mb-8 h-64 animate-pulse rounded-3xl bg-stone-100" />

      {/* Filter Bar Skeleton */}
      <div className="mb-8 flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-stone-100" />
        ))}
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="aspect-square animate-pulse bg-stone-100" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-stone-100" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-stone-100" />
              <div className="h-9 w-full animate-pulse rounded-md bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
