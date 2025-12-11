export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="pt-16">
        {/* Hero Section Skeleton */}
        <section className="relative bg-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="animate-pulse space-y-6">
              {/* Title skeleton */}
              <div className="h-12 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
              
              {/* Description skeleton */}
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-full max-w-2xl mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-5/6 max-w-2xl mx-auto"></div>
              </div>
              
              {/* Current plan info skeleton */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-8">
                <div className="h-6 bg-orange-200 rounded w-48 mx-auto mb-3"></div>
                <div className="h-4 bg-orange-100 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Plans Section Skeleton */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section title skeleton */}
            <div className="animate-pulse text-center mb-12 space-y-4">
              <div className="h-10 bg-gray-200 rounded w-64 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>

            {/* Plans grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg shadow-md p-6 h-[500px] flex flex-col">
                    {/* Badge area */}
                    <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
                    
                    {/* Price area */}
                    <div className="space-y-3 mb-6">
                      <div className="h-10 bg-gray-200 rounded w-24 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                      <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-3 flex-grow">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                          <div className="h-4 bg-gray-200 rounded flex-grow"></div>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <div className="h-12 bg-gray-200 rounded mt-6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section Skeleton */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse">
              {/* Section title */}
              <div className="text-center mb-12 space-y-4">
                <div className="h-10 bg-gray-200 rounded w-80 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-grow space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
