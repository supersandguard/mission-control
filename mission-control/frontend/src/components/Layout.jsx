import Sidebar from './Sidebar'

export default function Layout({ children, currentPage, setCurrentPage }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}