export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-neutral-800 mb-6">
            Welcome to <span className="text-primary-600">ShopSphere</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            Your ultimate e-commerce destination powered by modern microservices architecture. 
            Experience seamless shopping with Next.js, Node.js, GraphQL, and cutting-edge cloud technologies.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="btn-primary text-lg px-8 py-3">
              Start Shopping
            </button>
            <button className="btn-secondary text-lg px-8 py-3">
              Learn More
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-neutral-600">Built with Next.js and optimized for performance</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-neutral-600">Enterprise-grade security with JWT authentication</p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Scalable Architecture</h3>
            <p className="text-neutral-600">Microservices with Docker and Kubernetes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center text-neutral-800 mb-8">
            Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-primary-600 mb-2">Frontend</h4>
              <p className="text-sm text-neutral-600">Next.js, React, TypeScript, Tailwind CSS</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-accent-600 mb-2">Backend</h4>
              <p className="text-sm text-neutral-600">Node.js, Express, GraphQL, Microservices</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-primary-600 mb-2">Database</h4>
              <p className="text-sm text-neutral-600">MongoDB, Redis, Kafka</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-accent-600 mb-2">Infrastructure</h4>
              <p className="text-sm text-neutral-600">Docker, Kubernetes, AWS</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
