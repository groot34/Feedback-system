import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 my-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-[#1e293b]/50 text-gray-300 hover:bg-[#1e293b] hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                Previous
            </button>
            
            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="px-3 py-2 text-gray-500 font-medium">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all duration-300 ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white border border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        : 'border border-gray-700 bg-[#1e293b]/50 text-gray-300 hover:bg-[#1e293b] hover:border-blue-500/50 hover:text-blue-400'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-[#1e293b]/50 text-gray-300 hover:bg-[#1e293b] hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;
