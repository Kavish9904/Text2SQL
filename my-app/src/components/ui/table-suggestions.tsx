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
}

export function TableSuggestions({
  isOpen,
  onClose,
  onSelect,
  tables = [],
  triggerRef,
}: TableSuggestionsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = React.useCallback(
    (value: string) => {
      console.log("handleSelect called with:", value);
      onSelect(value);
      onClose();
    },
    [onSelect, onClose]
  );

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
        searchKey: `${column.name.toLowerCase()} ${table.name.toLowerCase()}`,
      }))
    );

    return { allTables, allColumns };
  }, [tables]);

  // Efficient filtering using pre-processed data
  const { filteredTables, filteredColumns } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      // Show all tables and all columns when no search query
      return {
        filteredTables: processedData.allTables,
        filteredColumns: processedData.allColumns,
      };
    }

    return {
      filteredTables: processedData.allTables.filter((table) =>
        table.searchKey.includes(query)
      ),
      filteredColumns: processedData.allColumns.filter((column) =>
        column.searchKey.includes(query)
      ),
    };
  }, [processedData, searchQuery]);

  if (!Array.isArray(tables)) {
    console.warn("TableSuggestions: tables prop must be an array");
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <span ref={triggerRef} />
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[400px]"
        sideOffset={5}
        align="start"
        side="bottom"
      >
        <Command>
          <CommandInput
            placeholder="Type to filter tables and columns..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            autoFocus
          />
          <CommandList className="max-h-[400px] overflow-y-auto">
            {filteredTables.length === 0 && filteredColumns.length === 0 ? (
              <CommandEmpty>No matches found.</CommandEmpty>
            ) : (
              <>
                <CommandGroup heading="Tables">
                  {filteredTables.map((table) => (
                    <div
                      key={table.name}
                      className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelect(`${table.name}.*`)}
                    >
                      <Database className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="flex-1 font-medium">{table.name}</span>
                      <span className="text-xs text-gray-400">
                        ({table.columns.length} columns)
                      </span>
                    </div>
                  ))}
                </CommandGroup>

                <CommandGroup heading="Columns">
                  {filteredColumns.map((column, index) => (
                    <div
                      key={`${column.tableName}.${column.name}-${index}`}
                      className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer group"
                      onClick={() =>
                        handleSelect(`${column.tableName}.${column.name}`)
                      }
                    >
                      <Table className="h-4 w-4 mr-2 text-gray-500" />
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">
                          {column.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          in {column.tableName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-gray-600">
                        {column.type}
                      </span>
                    </div>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
