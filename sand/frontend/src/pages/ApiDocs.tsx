import { useState, useEffect } from 'react'
import { Book, Code, Send, Eye, Shield, Brain, Folder, ChevronDown, ChevronRight, Copy, CheckCircle } from 'lucide-react'

interface EndpointProps {
  id: string
  method: 'GET' | 'POST'
  path: string
  title: string
  description: string
  requestBody?: any
  responseBody: any
  queryParams?: any
}

const endpoints: EndpointProps[] = [
  {
    id: 'decode',
    method: 'POST',
    path: '/api/decode',
    title: 'Decode Transaction Calldata',
    description: 'Decode transaction calldata into human-readable function calls and parameters',
    requestBody: {
      contractAddress: 'string',
      calldata: 'string',
      'chainId?': 'number'
    },
    responseBody: {
      functionName: 'string',
      params: 'array',
      contractName: 'string'
    }
  },
  {
    id: 'simulate',
    method: 'POST',
    path: '/api/simulate',
    title: 'Simulate Transaction',
    description: 'Simulate transaction execution and get balance changes, gas usage, and state diffs',
    requestBody: {
      to: 'string',
      from: 'string',
      data: 'string',
      value: 'string',
      'chainId?': 'number'
    },
    responseBody: {
      success: 'boolean',
      balanceChanges: 'array',
      gasUsed: 'string'
    }
  },
  {
    id: 'risk',
    method: 'POST',
    path: '/api/risk',
    title: 'Get Risk Score',
    description: 'Analyze transaction risk and get AI-powered risk assessment with policy violations',
    requestBody: {
      to: 'string',
      data: 'string',
      value: 'string',
      'chainId?': 'number'
    },
    responseBody: {
      score: 'number',
      level: 'string',
      reasons: 'array',
      policies: 'array'
    }
  },
  {
    id: 'explain',
    method: 'POST',
    path: '/api/explain',
    title: 'AI Explanation',
    description: 'Get AI-powered natural language explanation of transaction purpose and effects',
    requestBody: {
      contractAddress: 'string',
      calldata: 'string',
      'decoded?': 'object',
      'simulation?': 'object'
    },
    responseBody: {
      explanation: 'string'
    }
  },
  {
    id: 'safe-transactions',
    method: 'GET',
    path: '/api/safe/:address/transactions',
    title: 'List Pending Safe Transactions',
    description: 'Get pending transactions from a Safe multisig wallet',
    queryParams: {
      'chainId?': 'number'
    },
    responseBody: {
      results: 'array'
    }
  }
]

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
      title={label || 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <CheckCircle size={12} className="text-emerald-400" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </button>
  )
}

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  const colors = {
    GET: 'bg-emerald-500 text-white',
    POST: 'bg-blue-500 text-white'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[method]}`}>
      {method}
    </span>
  )
}

function CodeBlock({ title, code, language = 'json' }: { title: string; code: string; language?: string }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-300">{title}</h4>
        <CopyButton text={code} />
      </div>
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm overflow-x-auto">
        <code className="text-slate-100">{code}</code>
      </pre>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: EndpointProps }) {
  const [expanded, setExpanded] = useState(false)

  const curlCommand = `curl -X ${endpoint.method} \\
  https://api.sandguard.com${endpoint.path} \\
  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\
  -d '${JSON.stringify({
    ...Object.fromEntries(
      Object.entries(endpoint.requestBody).map(([key, value]) => [
        key.replace('?', ''),
        value === 'string' ? 'example_value' : value === 'number' ? 1 : value === 'array' ? [] : value === 'object' ? {} : 'example'
      ])
    )
  }, null, 2)}'` : ''}`

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-slate-750 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <MethodBadge method={endpoint.method} />
          <span className="font-mono text-slate-100">{endpoint.path}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300 hidden sm:block">{endpoint.title}</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-slate-700">
          <p className="text-slate-300 mb-4">{endpoint.description}</p>

          {endpoint.requestBody && (
            <CodeBlock
              title="Request Body"
              code={JSON.stringify(endpoint.requestBody, null, 2)}
            />
          )}

          {endpoint.queryParams && (
            <CodeBlock
              title="Query Parameters"
              code={JSON.stringify(endpoint.queryParams, null, 2)}
            />
          )}

          <CodeBlock
            title="Response"
            code={JSON.stringify(endpoint.responseBody, null, 2)}
          />

          <CodeBlock
            title="cURL Example"
            code={curlCommand}
            language="bash"
          />
        </div>
      )}
    </div>
  )
}

function Sidebar({ activeSection, onSectionChange }: { activeSection: string; onSectionChange: (section: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sections = [
    { id: 'overview', title: 'Overview', icon: Book },
    { id: 'authentication', title: 'Authentication', icon: Shield },
    { id: 'endpoints', title: 'API Endpoints', icon: Code },
  ]

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Book size={20} className="text-purple-400" />
          API Documentation
        </h2>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {sections.map(({ id, title, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => {
                  onSectionChange(id)
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === id
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {title}
              </button>
            </li>
          ))}
          <li className="pt-2 border-t border-slate-700">
            <div className="px-3 py-2 text-xs text-slate-400 uppercase tracking-wide">
              Endpoints
            </div>
            <ul className="space-y-1">
              {endpoints.map((endpoint) => (
                <li key={endpoint.id}>
                  <button
                    onClick={() => {
                      onSectionChange(endpoint.id)
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === endpoint.id
                        ? 'bg-purple-500 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <MethodBadge method={endpoint.method} />
                    <span className="truncate">{endpoint.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-slate-800 p-2 rounded-lg border border-slate-700"
        >
          <Folder size={20} className="text-slate-300" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-10 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-10 w-80 bg-slate-900 border-r border-slate-700 transform transition-transform lg:transform-none ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {sidebarContent}
      </div>
    </>
  )
}

export default function ApiDocs() {
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => { 
    document.title = 'API Documentation — SandGuard' 
  }, [])

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">SandGuard API</h1>
            <p className="text-xl text-slate-300">
              Integrate transaction security and analysis into your applications
            </p>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Base URL</h2>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                <code className="text-emerald-400">https://api.sandguard.com</code>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Search size={20} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Transaction Decoding</strong>
                    <p className="text-slate-300">Decode complex transaction calldata into readable function calls</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Eye size={20} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Transaction Simulation</strong>
                    <p className="text-slate-300">Simulate transactions to preview balance changes and gas costs</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Risk Analysis</strong>
                    <p className="text-slate-300">AI-powered risk scoring with policy violation detection</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Brain size={20} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">AI Explanations</strong>
                    <p className="text-slate-300">Natural language explanations of transaction purpose and effects</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )

      case 'authentication':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Authentication</h1>
            
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Public API</h2>
              <p className="text-slate-300 mb-4">
                SandGuard API is currently public and does not require authentication. 
                All endpoints are available without API keys or tokens.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  <strong>Note:</strong> Rate limiting may apply. For high-volume usage, 
                  contact us at support@sandguard.com for dedicated access.
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Headers</h2>
              <p className="text-slate-300 mb-4">Include the following headers in your requests:</p>
              <CodeBlock
                title="Required Headers"
                code={`Content-Type: application/json
Accept: application/json`}
              />
            </div>
          </div>
        )

      case 'endpoints':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">API Endpoints</h1>
            <p className="text-slate-300">
              Complete reference for all SandGuard API endpoints
            </p>
            
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} />
              ))}
            </div>
          </div>
        )

      default:
        const endpoint = endpoints.find(e => e.id === activeSection)
        if (endpoint) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MethodBadge method={endpoint.method} />
                <h1 className="text-3xl font-bold text-white font-mono">{endpoint.path}</h1>
              </div>
              
              <p className="text-xl text-slate-300">{endpoint.description}</p>
              
              <EndpointCard endpoint={endpoint} />
            </div>
          )
        }
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <main className="flex-1 lg:ml-0 ml-0">
          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}