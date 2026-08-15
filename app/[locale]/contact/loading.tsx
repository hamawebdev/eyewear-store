export default function ContactLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="mb-12 flex flex-col items-center gap-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-stone-100" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded bg-stone-100" />
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Phone Buttons Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
        </div>

        {/* Form Skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 h-7 w-48 animate-pulse rounded bg-stone-100" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
              <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
            </div>
            <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
            <div className="h-32 animate-pulse rounded-lg bg-stone-100" />
            <div className="h-11 animate-pulse rounded-lg bg-stone-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
