export default function RootLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
        <div className="h-48 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-48 bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
