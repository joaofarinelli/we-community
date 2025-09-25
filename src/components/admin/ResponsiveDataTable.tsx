import { ReactNode } from 'react';

interface Column {
  key: string;
  header: string;
  className?: string;
  render: (item: any) => ReactNode;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

interface ResponsiveDataTableProps {
  data: any[];
  columns: Column[];
  groupBy?: string;
  groupRenderer?: (groupKey: string, groupData: any[], children: ReactNode) => ReactNode;
  emptyState?: ReactNode;
  mobileCardRenderer?: (item: any, index: number) => ReactNode;
  className?: string;
}

export const ResponsiveDataTable = ({
  data,
  columns,
  groupBy,
  groupRenderer,
  emptyState,
  mobileCardRenderer,
  className = ""
}: ResponsiveDataTableProps) => {
  if (!data || data.length === 0) {
    return emptyState || <div className="text-center py-8 text-muted-foreground">Nenhum item encontrado</div>;
  }

  // Mobile view (< 768px) - Show cards
  const MobileView = () => {
    if (mobileCardRenderer) {
      return (
        <div className="md:hidden space-y-3">
          {data.map((item, index) => mobileCardRenderer(item, index))}
        </div>
      );
    }

    return (
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div key={index} className="bg-card border rounded-lg p-4 space-y-3">
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {column.header}
                </span>
                <div className="text-sm">
                  {column.render(item)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Desktop/Tablet view (>= 768px) - Show table
  const TableView = () => {
    const groupedData: Record<string, any[]> = groupBy ? 
      data.reduce((acc, item) => {
        const key = item[groupBy];
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, any[]>) : 
      { all: data };

    return (
      <div className="hidden md:block">
        {Object.entries(groupedData).map(([groupKey, groupData]: [string, any[]]) => {
          const tableContent = (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`text-left p-3 sm:p-4 font-medium ${column.className || ''} ${
                          column.hideOnTablet ? 'hidden lg:table-cell' : ''
                        }`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/25">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`p-3 sm:p-4 ${column.className || ''} ${
                            column.hideOnTablet ? 'hidden lg:table-cell' : ''
                          }`}
                        >
                          {column.render(item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

          return groupRenderer && groupBy !== 'all' ? (
            <div key={groupKey} className="space-y-4">
              {groupRenderer(groupKey, groupData, tableContent)}
            </div>
          ) : (
            <div key={groupKey}>
              {tableContent}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={className}>
      <MobileView />
      <TableView />
    </div>
  );
};