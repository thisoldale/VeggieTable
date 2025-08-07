import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  ColumnSizingState,
} from '@tanstack/react-table';

interface SimpleRow {
  id: number;
  name: string;
  value: string;
}

const defaultData: SimpleRow[] = [
  { id: 1, name: 'Item A', value: 'Alpha' },
  { id: 2, name: 'Item B', value: 'Beta' },
  { id: 3, name: 'Item C', value: 'Gamma' },
];

const SimpleResizableTable: React.FC = () => {
  const [data] = useState<SimpleRow[]>(defaultData);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const columns = React.useMemo<ColumnDef<SimpleRow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableResizing: true,
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        enableResizing: true,
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        enableResizing: true,
        cell: info => info.getValue(),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Simple Resizable Table</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 border border-gray-300">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 font-medium select-none"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {/* Resizer */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={e => {
                          console.log('Simple Resizer MOUSE DOWN event triggered!');
                          console.log('--- Simple Debugging header ---');
                          console.log('header object:', header);
                          console.log('Does header have "getResizeHandler" property?', 'getResizeHandler' in header);
                          console.log('Type of header.getResizeHandler:', typeof header.getResizeHandler);
                          try {
                            const resizeHandler = header.getResizeHandler(); // <-- CORRECTED
                            console.log('getResizeHandler returned (simple):', resizeHandler);
                            if (resizeHandler) {
                              resizeHandler(e);
                            } else {
                              console.warn('Simple getResizeHandler returned null or undefined.');
                            }
                          } catch (err) {
                            console.error('Error calling Simple header.getResizeHandler():', err);
                          }
                        }}
                        onTouchStart={e => {
                           console.log('Simple Resizer TOUCH START event triggered!');
                           // Similar debug logs as above for touch
                           try {
                             const resizeHandler = header.getResizeHandler(); // <-- CORRECTED
                             if (resizeHandler) resizeHandler(e);
                           } catch (err) {
                             console.error('Error calling Simple header.getResizeHandler():', err);
                           }
                        }}
                        className={`resizer ${
                          header.column.getIsResizing() ? 'isResizing' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 font-normal text-gray-900 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimpleResizableTable;