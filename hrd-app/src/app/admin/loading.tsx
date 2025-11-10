export default function Loading() {
  return (
    <section className="max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-7 w-32 bg-gray-200 rounded" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="h-3 w-1/3 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      ))}
    </section>
  );
}
