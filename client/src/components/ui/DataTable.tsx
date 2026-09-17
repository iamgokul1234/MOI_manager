import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Mobile rendering: a card per row. Never a horizontally scrolling page. */
  renderMobileCard: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  className?: string;
  /** Optional footer (pagination etc.) rendered below both layouts. */
  footer?: React.ReactNode;
}

/**
 * Responsive table: <table> on md+ screens, stacked cards below.
 * The two layouts share the same row data so search/filter/attended state
 * is always identical on phone and desktop.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderMobileCard,
  onRowClick,
  rowClassName,
  className,
  footer,
}: DataTableProps<T>) {
  const alignClass = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop */}
      <div className="hidden md:block">
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              {columns.map((c) => (
                <col key={c.key} style={c.width ? { width: c.width } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide',
                      alignClass(c.align),
                      c.headerClassName
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50',
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn('px-4 py-3 align-middle', alignClass(c.align), c.className)}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row))}
          >
            {renderMobileCard(row)}
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}
