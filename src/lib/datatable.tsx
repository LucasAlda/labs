import { DataTableColumnHeader } from "@/components/column-header-helper";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, type TableCardProps, TableContainer, type rowVariants, useTableRowContext } from "@/lib/table";
import { cn } from "@/lib/utils";
import {
  type VisibilityState,
  type SortingState,
  type ExpandedState,
  type Row,
  sortingFns,
  useReactTable,
  getExpandedRowModel,
  getCoreRowModel,
  getSortedRowModel,
  type Table as TTable,
} from "@tanstack/react-table";
import { type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  Children,
  useEffect,
} from "react";

type GetRow<T> = T extends Array<infer K>
  ? K extends { subRows: unknown }
    ? { "Provide a type on useTable": true }
    : K
  : never;

export function useTable<T extends Array<Record<string, unknown>>>({
  data,
  sortMinDepth = 0,
}: {
  data: T;
  sortMinDepth?: number;
}) {
  const [columns, setColumns] = useState<Array<ColumnProps>>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const autoDepthSort = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: Row<any>, b: Row<any>, columnId: string) => {
      if (a.depth < sortMinDepth || b.depth < sortMinDepth) return 0;

      if (a.getValue(columnId) instanceof Date && b.getValue(columnId) instanceof Date) {
        return sortingFns.datetime(a, b, columnId);
      }
      return sortingFns.alphanumeric(a, b, columnId);
    },
    [sortMinDepth]
  );

  const tanstackColumns = useMemo(
    () =>
      columns.map((col) => ({
        accessorKey: "accessor" in col ? col.accessor : col.accessorAlias,
        header: col.label,
        sortingFn: autoDepthSort,
      })),
    [columns, autoDepthSort]
  );

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      sorting,
      columnVisibility,
      expanded,
    },
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows as Record<string, unknown>[],
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    sortingFns: {
      auto: autoDepthSort,
    },
    getSortedRowModel: getSortedRowModel(),
  });

  type DateTable = Omit<typeof DataTable, "Column" | "Rows"> & {
    Rows: (
      props: Omit<RowsProps, "variant"> & {
        variant?: (row: GetRow<T>) => ReturnType<NonNullable<RowsProps["variant"]>>;
      }
    ) => JSX.Element;
    Column: (
      props: Omit<ColumnProps, "accessor" | "accessorAlias" | "children"> & {
        children?:
          | ReactNode
          | ((props: { row: GetRow<T>; variant: VariantProps<typeof rowVariants>["variant"] }) => ReactNode);
      } & ({ accessor: keyof GetRow<T> } | { accessorAlias: string })
    ) => null;
  };

  return [{ table, setColumns, columns, columnVisibility }, DataTable as DateTable] as const;
}

type UseTable = {
  table: TTable<Record<string, unknown>>;
  setColumns: Dispatch<SetStateAction<ColumnProps[]>>;
  columns: ColumnProps[];
  columnVisibility: VisibilityState;
};
const DataTableCtx2 = createContext<UseTable>(null as unknown as UseTable);

const useTableCtx = () => useContext(DataTableCtx2);

function DataTableRoot({ table, ...props }: TableCardProps & { children: ReactNode; table: UseTable }) {
  return (
    <DataTableCtx2.Provider value={table}>
      <TableContainer {...props} />
    </DataTableCtx2.Provider>
  );
}

function Title({ children, className }: { children?: ReactNode; className?: string }) {
  return <h3 className={cn("font-medium leading-none text-slate-800", className)}>{children}</h3>;
}

type ColumnProps = {
  isDate?: boolean;
  isNumber?: boolean;
  align?: "center" | "right" | "left";
  label: string;
  children?:
    | ReactNode
    | ((props: { row: Record<string, unknown>; variant: VariantProps<typeof rowVariants>["variant"] }) => ReactNode);
  expandable?: boolean;
} & ({ accessor: string } | { accessorAlias: string });

function Column(props: ColumnProps) {
  props;
  return null;
}

function ColumnBody({ expandable, ...props }: ColumnProps & { row: Row<Record<string, unknown>> }) {
  const tableRowctx = useTableRowContext();
  const children =
    typeof props.children === "function"
      ? props.children({ row: props.row.original, variant: tableRowctx.variant ?? "none" })
      : props.children;

  const accessor = "accessor" in props ? props.accessor : props.accessorAlias;
  if ("accessorAlias" in props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessorAlias, ...rest } = props;
    props = { accessor, ...rest };
  }

  if (expandable && props.row.getCanExpand()) {
    return (
      <Table.Cell {...props}>
        {children ?? (props.row.original[accessor] as ReactNode)}
        <button
          {...{
            onClick: props.row.getToggleExpandedHandler(),
            style: { cursor: "pointer" },
          }}
        >
          {props.row.getIsExpanded() ? (
            <ChevronDown className="-mb-1 ml-1 h-4 w-4 opacity-90" />
          ) : (
            <ChevronRight className="-mb-1 ml-1 h-4 w-4 opacity-90" />
          )}
        </button>
      </Table.Cell>
    );
  }

  return <Table.Cell {...props}>{children ?? (props.row.original[accessor] as ReactNode)}</Table.Cell>;
}

export function DataTableViewOptions() {
  const { table } = useTableCtx();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <Settings2 className="mr-2 h-4 w-4" />
          Vista
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.columnDef.header?.toString() ?? column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type RowsProps = {
  children: ReactNode;
  variant?: (row: Record<string, unknown>) => {
    [k in NonNullable<VariantProps<typeof rowVariants>["variant"]>]?: boolean;
  };
  collapsable?: boolean;
};
function Rows({ children, variant, collapsable }: RowsProps) {
  const table = useTableCtx();
  const tanstackColumns = table.table.getVisibleFlatColumns();

  const columns = Children.map(children as never, ({ props }: { props: ColumnProps }) => props);
  useEffect(() => {
    table.setColumns(columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map((col) => ("accessor" in col ? col.accessor : col.accessorAlias)).join(",")]);

  return (
    <>
      <Table.Head>
        <tr>
          {Children.map(children as never, ({ props }: { props: ColumnProps }) => {
            const accessor = "accessor" in props ? props.accessor : props.accessorAlias;
            const col = tanstackColumns.find((col) => col.id === accessor);

            if (table.columns.length > 0 && !col) return null;

            if ("accessorAlias" in props) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { accessorAlias, ...rest } = props;
              props = { accessor, ...rest };
            }

            return (
              <Table.Column key={accessor} {...props}>
                <DataTableColumnHeader
                  column={col}
                  title={props.label}
                  sortIconPlace={props.align === "right" || props.isNumber ? "right-full" : "left-full"}
                />
              </Table.Column>
            );
          })}
        </tr>
      </Table.Head>
      <tbody>
        {table.table.getRowModel().rows.map((row) => {
          const entries = Object.entries(variant?.(row.original) ?? {}) as Array<
            [NonNullable<VariantProps<typeof rowVariants>["variant"]>, boolean]
          >;
          const selectedVariant = entries.find(([, value]) => value)?.[0];
          const cells = row.getVisibleCells();

          return (
            <Table.Row key={row.id} variant={selectedVariant}>
              {Children.map(children as never, ({ props }: { props: ColumnProps }, i) => {
                const accessor = "accessor" in props ? props.accessor : props.accessorAlias;

                const cell = cells.find((cell) => cell.column.id === accessor);

                if (table.columns.length > 0 && !cell) return null;

                return <ColumnBody {...props} row={row} expandable={collapsable && row.getCanExpand() && i === 0} />;
              })}
            </Table.Row>
          );
        })}
      </tbody>
    </>
  );
}

export const DataTable = {
  Root: DataTableRoot,
  Header: TableContainer.Header,
  Title: Title,
  Config: DataTableViewOptions,
  Content: Table,
  Rows: Rows,
  Column: Column,
};
