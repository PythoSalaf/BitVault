import React from "react";

interface Column<T> {
  header: string;
  accessor: keyof T;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

function Reusetable<T extends { id: string }>({
  columns,
  data,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-primary">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.accessor)}
                className="px-4 py-3 font-semibold text-base md:text-lg"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t">
              {columns.map((col) => (
                <td key={String(col.accessor)} className="px-4 py-3">
                  {String(row[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reusetable;
