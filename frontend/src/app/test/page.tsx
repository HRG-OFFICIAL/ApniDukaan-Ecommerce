export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          Tailwind CSS Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Card 1</h2>
            <p className="text-gray-600 mb-4">
              This is a test card to verify Tailwind CSS is working properly.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Test Button
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Card 2</h2>
            <p className="text-gray-600 mb-4">
              If you can see proper styling, colors, and spacing, Tailwind is working!
            </p>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              Success
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Card 3</h2>
            <p className="text-gray-600 mb-4">
              Check for proper grid layout, colors, and responsive design.
            </p>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Error
            </button>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-yellow-100 border-l-4 border-yellow-500">
          <p className="text-yellow-800">
            <strong>Note:</strong> If you see this page with proper styling (colors, spacing, layout), 
            then Tailwind CSS is working correctly. The main page issue might be with component dependencies.
          </p>
        </div>
      </div>
    </div>
  )
}
