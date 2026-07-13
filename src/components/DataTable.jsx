import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DataTable({ columns = [], data = [], renderActions = null, rowKey = "id", itemsPerPage = 10 }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedColumns = columns.map(column => {
    if (typeof column === "string") return { key: column.toLowerCase(), header: column };
    return { key: column.key, header: column.header, render: column.render };
  });

  // Filter Data
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  if (data.length === 0) {
    return (
      <div className="text-center p-5 rounded-4 d-flex flex-column justify-content-center align-items-center" style={{ background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', minHeight: '300px' }}>
        <Inbox size={48} color="var(--text-secondary)" className="mb-3 opacity-50" />
        <h5 className="fw-bold mb-2">No Records Found</h5>
        <p className="text-muted mb-0">There is no data to display here yet.</p>
      </div>
    );
  }

  return (
    <div className="data-grid-container rounded-4 overflow-hidden" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      {/* Grid Toolbar */}
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ borderColor: 'var(--glass-border) !important' }}>
        <div className="position-relative" style={{ minWidth: '250px' }}>
          <Search className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
          <input 
            type="text" 
            className="modern-input ps-5 py-2 w-100" 
            placeholder="Search all columns..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ borderRadius: '12px' }}
          />
        </div>
        <div className="text-muted small">
          Showing {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
      </div>

      {/* Grid Table */}
      <div className="table-responsive">
        <table className="table table-dark table-hover mb-0 modern-data-grid" style={{ background: 'transparent' }}>
          <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <tr>
              {normalizedColumns.map((column) => (
                <th key={column.key} className="bg-transparent text-muted fw-bold py-3 px-4" style={{ borderBottom: 'none', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  {column.header}
                </th>
              ))}
              {renderActions && (
                <th className="bg-transparent text-muted fw-bold py-3 px-4 text-end" style={{ borderBottom: 'none', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                  key={item[rowKey] || index} 
                  style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--glass-border)' }}
                >
                  {normalizedColumns.map((column) => (
                    <td key={column.key} className="bg-transparent py-3 px-4 border-0 align-middle">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="bg-transparent py-3 px-4 border-0 align-middle text-end">
                      {renderActions(item)}
                    </td>
                  )}
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={normalizedColumns.length + (renderActions ? 1 : 0)} className="text-center py-5 bg-transparent border-0 text-muted">
                    No results match your search query.
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-top d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--glass-border) !important' }}>
          <button 
            onClick={handlePrev} 
            disabled={currentPage === 1}
            className="btn btn-sm glass-panel d-flex align-items-center gap-1 py-2 px-3 rounded-pill"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          
          <div className="d-flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0`}
                style={{ 
                  width: '28px', height: '28px', 
                  background: currentPage === i + 1 ? 'var(--accent-color)' : 'transparent',
                  color: currentPage === i + 1 ? '#fff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={handleNext} 
            disabled={currentPage === totalPages}
            className="btn btn-sm glass-panel d-flex align-items-center gap-1 py-2 px-3 rounded-pill"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}