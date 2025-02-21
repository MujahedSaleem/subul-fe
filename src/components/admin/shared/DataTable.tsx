import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  hidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

function DataTable<T>({ columns, data, emptyMessage = 'لا توجد بيانات' }: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-xl backdrop-saturate-150">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/80">
          <thead>
            <tr className="bg-gradient-to-br from-slate-50 to-slate-100/80">
              {columns.map((column, index) => (
                !column.hidden && (
                  <th
                    key={index}
                    className={`
                      px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider
                      ${column.className || ''}
                    `}
                  >
                    {column.header}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 bg-white/80">
            {data.length > 0 ? (
              data.map((item, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className="transition-colors duration-150 hover:bg-slate-50/80"
                >
                  {columns.map((column, colIndex) => (
                    !column.hidden && (
                      <td 
                        key={colIndex} 
                        className={`
                          px-6 py-4 whitespace-nowrap text-sm text-slate-600
                          ${column.className || ''}
                        `}
                      >
                        {typeof column.accessor === 'function'
                          ? column.accessor(item)
                          : item[column.accessor]}
                      </td>
                    )
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.filter(col => !col.hidden).length}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <svg className="w-12 h-12 mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;