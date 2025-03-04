import React, { useMemo } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Wand2, Search, Code2, Table2, Wrench, FileCode2 } from "lucide-react";

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: string;
}

const defaultCommands: CommandItem[] = [
  {
    id: "explain",
    name: "Explain Code",
    description: "Explain code for current cell",
    icon: <Wand2 className="h-4 w-4 text-gray-500" />,
    action: "/explain",
  },
  {
    id: "prettify",
    name: "Prettify Code",
    description: "Prettify my code",
    icon: <Code2 className="h-4 w-4 text-gray-500" />,
    action: "/prettify",
  },
  {
    id: "findTables",
    name: "Find Tables",
    description: "Find tables to query",
    icon: <Table2 className="h-4 w-4 text-gray-500" />,
    action: "/findTables",
  },
  {
    id: "optimize",
    name: "Optimize Code",
    description: "Optimize my code",
    icon: <Wrench className="h-4 w-4 text-gray-500" />,
    action: "/optimize",
  },
  {
    id: "scratchpad",
    name: "Create Scratchpad",
    description: "Create a code cell usable like a scratchpad",
    icon: <FileCode2 className="h-4 w-4 text-gray-500" />,
    action: "/scratchpad",
  },
];

interface CommandSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export function CommandSuggestions({
  isOpen,
  onClose,
  onSelect,
  triggerRef,
}: CommandSuggestionsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = React.useCallback(
    (value: string) => {
      onSelect(value);
      onClose();
    },
    [onSelect, onClose]
  );

  const filteredCommands = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return defaultCommands;

    return defaultCommands.filter(
      (command) =>
        command.name.toLowerCase().includes(query) ||
        command.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <span ref={triggerRef} />
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[300px]"
        sideOffset={5}
        align="start"
        side="bottom"
      >
        <Command>
          <CommandInput
            placeholder="Type a command..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            autoFocus
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <CommandEmpty>No commands found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Commands">
                {filteredCommands.map((command) => (
                  <div
                    key={command.id}
                    className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelect(command.action)}
                  >
                    <div className="mr-2">{command.icon}</div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium">
                        {command.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {command.description}
                      </span>
                    </div>
                  </div>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
