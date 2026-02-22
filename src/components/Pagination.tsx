import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalCount, 
  pageSize, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando <span>{(currentPage - 1) * pageSize + 1}</span> a <span>{Math.min(currentPage * pageSize, totalCount)}</span> de <span>{totalCount}</span> registros
      </div>
      <div className="pagination-controls">
        <button 
          className="btn-pagi" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button 
            key={page}
            className={`btn-pagi ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button 
          className="btn-pagi" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border-top: 1px solid var(--border-light);
          margin-top: auto;
        }

        .pagination-info {
          font-size: 13px;
          color: var(--text-muted);
        }

        .pagination-info span {
          font-weight: 600;
          color: var(--text-primary);
        }

        .pagination-controls {
          display: flex;
          gap: 6px;
        }

        .btn-pagi {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-pagi:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background: #f8fafc;
        }

        .btn-pagi.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .btn-pagi:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f1f5f9;
        }

        @media (max-width: 640px) {
          .pagination-container {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Pagination;
