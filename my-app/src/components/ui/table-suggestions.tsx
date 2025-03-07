import React, { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Database, Table } from "lucide-react";

interface TableMetadata {
  name: string;
  columns: Array<{
    name: string;
    type: string;
  }>;
}

interface TableSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  tables?: TableMetadata[];
  triggerRef: React.RefObject<HTMLElement>;
  initialSearchQuery?: string;
}

export function TableSuggestions({
  isOpen,
  onClose,
  onSelect,
  tables = [],
  triggerRef,
  initialSearchQuery = "",
}: TableSuggestionsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Update search query when initialSearchQuery changes
  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Reset search when dropdown closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Pre-process tables and columns once on mount
  const processedData = useMemo(() => {
    if (!Array.isArray(tables)) return { allTables: [], allColumns: [] };

    const allTables = tables.map((table) => ({
      ...table,
      searchKey: table.name.toLowerCase(),
    }));

    const allColumns = tables.flatMap((table) =>
      table.columns.map((column) => ({
        ...column,
        tableName: table.name,
        searchKey: `${column.name.toLowerCase()}`,
      }))
    );

    return { allTables, allColumns };
  }, [tables]);

  // Enhanced filtering using pre-processed data
  const { filteredTables, filteredColumns } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // If query is empty, show all tables and columns
    if (!query) {
      return {
        filteredTables: processedData.allTables,
        filteredColumns: processedData.allColumns,
      };
    }

    // Filter tables that start with the query
    const tables = processedData.allTables.filter((table) =>
      table.name.toLowerCase().startsWith(query)
    );

    // Filter columns that start with the query
    const columns = processedData.allColumns.filter((column) =>
      column.name.toLowerCase().startsWith(query)
    );

    return {
      filteredTables: tables,
      filteredColumns: columns,
    };
  }, [processedData, searchQuery]);

  if (!Array.isArray(tables)) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <span ref={triggerRef} />
      </PopoverTrigger>
      <PopoverContent
        className="p-2 w-[400px]"
        sideOffset={5}
        align="start"
        side="bottom"
      >
        <div className="space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables and columns..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="max-h-[300px] overflow-y-auto">
            {filteredTables.length === 0 && filteredColumns.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No results found
              </div>
            ) : (
              <>
                {filteredTables.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                      TABLES
                    </div>
                    {filteredTables.map((table) => (
                      <div
                        key={table.name}
                        className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer rounded-md"
                        onClick={() => {
                          onSelect(`${table.name}.*`);
                          onClose();
                        }}
                      >
                        <Database className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="flex-1 text-sm">{table.name}</span>
                        <span className="text-xs text-gray-400">
                          ({table.columns.length} columns)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {filteredColumns.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                      COLUMNS
                    </div>
                    {filteredColumns.map((column, index) => (
                      <div
                        key={`${column.tableName}.${column.name}-${index}`}
                        className="flex items-center px-2 py-1.5 hover:bg-gray-100 cursor-pointer rounded-md"
                        onClick={() => {
                          onSelect(`${column.tableName}.${column.name}`);
                          onClose();
                        }}
                      >
                        <Table className="h-4 w-4 mr-2 text-gray-500" />
                        <div className="flex flex-col flex-1">
                          <span className="text-sm">{column.name}</span>
                          <span className="text-xs text-gray-500">
                            in {column.tableName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {column.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
