export default function Loading() {
  return (
    <section className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="h-7 w-40 bg-gray-200 rounded" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="h-24 bg-gray-200 rounded" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="h-10 w-24 bg-gray-200 rounded" />
    </section>
  );
}
