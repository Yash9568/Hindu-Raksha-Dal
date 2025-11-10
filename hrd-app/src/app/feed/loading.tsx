export default function Loading() {
  return (
    <section className="max-w-2xl mx-auto animate-pulse">
      <div className="h-7 w-24 bg-gray-200 rounded mb-4" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <article key={i} className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-48 bg-gray-200" />
            <div className="p-3">
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
