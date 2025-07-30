export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to your NotebookLM Clone dashboard
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900">Documents</h3>
            <p className="mt-1 text-sm text-gray-600">
              Upload and manage your documents
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900">Chat</h3>
            <p className="mt-1 text-sm text-gray-600">
              Ask questions about your documents
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900">Search</h3>
            <p className="mt-1 text-sm text-gray-600">
              Semantic search across your content
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}