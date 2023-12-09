const data: Array<Record<string, unknown>> = [
  {
    type: "header",
    date: "Total Disponible" as unknown as Date,
    amount: 500000,
    subRows: [
      {
        date: new Date("2021-01-01"),
        asset: "AAPL",
        quantity: 10,
        amount: 100,
        subRows: undefined,
      },
      {
        date: new Date("2021-01-01"),
        asset: "MELI",
        quantity: 5,
        amount: 200,
        subRows: undefined,
      },
      {
        date: new Date("2021-01-01"),
        asset: "TSLA",
        quantity: 3,
        amount: 50,
        subRows: undefined,
      },
    ],
  },
  {
    type: "footer",
    date: "Total",
    header: true,
    amount: 350,
    subRows: undefined,
  },
];

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
import { DataTable } from "@/lib/datatable";
import { Table, type TableCardProps, TableContainer, type rowVariants, useTableRowContext } from "@/lib/table";
import { cn } from "@/lib/utils";
import {
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  getExpandedRowModel,
  type ExpandedState,
} from "@tanstack/react-table";
import { type VariantProps } from "class-variance-authority";
import { Settings2 } from "lucide-react";
import { type ReactNode, useState, createContext, useContext, Children, useEffect, useMemo } from "react";

function useTable2<T extends Array<Record<string, unknown>>>({ data }: { data: T }) {
  const [columns, setColumns] = useState<Array<ColumnProps>>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const tanstackColumns = useMemo(
    () => columns.map((col) => ({ accessorKey: col.accessor, header: col.label })),
    [columns]
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
    getSortedRowModel: getSortedRowModel(),
  });

  return { table, setColumns, columns, columnVisibility };
}

const DataTableCtx2 = createContext<ReturnType<typeof useTable2>>(null as unknown as ReturnType<typeof useTable2>);

const useTableCtx = () => useContext(DataTableCtx2);

function DataTableRoot({
  table,
  ...props
}: TableCardProps & { children: ReactNode; table: ReturnType<typeof useTable2> }) {
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
  accessor: string;
  children?:
    | ReactNode
    | ((props: { row: Record<string, unknown>; variant: VariantProps<typeof rowVariants>["variant"] }) => ReactNode);
};

function ColumnBody(props: ColumnProps & { row: Record<string, unknown> }) {
  const tableRowctx = useTableRowContext();
  console.log("rows", props.row, tableRowctx);

  const children =
    typeof props.children === "function"
      ? props.children({ row: props.row, variant: tableRowctx.variant ?? "none" })
      : props.children;

  return <Table.Cell {...props}>{children ?? (props.row[props.accessor] as ReactNode)}</Table.Cell>;
}

export function DataTableViewOptions() {
  const { table } = useTableCtx();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <Settings2 className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Rows({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: (row: Record<string, unknown>) => {
    [k in NonNullable<VariantProps<typeof rowVariants>["variant"]>]?: boolean;
  };
}) {
  const table = useTableCtx();
  const columns = Children.map(children as never, ({ props }: { props: ColumnProps }) => props);

  useEffect(() => {
    table.setColumns(columns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.map((col) => col.accessor).join(",")]);

  return (
    <>
      <Table.Head>
        <tr>
          {Children.map(children as never, ({ props }: { props: ColumnProps }) => {
            const col = table.table.getColumn(props.accessor);

            if (table.columns.length > 0 && !col) return null;

            return (
              <Table.Column key={props.accessor}>
                <DataTableColumnHeader column={col} title={props.label} />
              </Table.Column>
            );
          })}
        </tr>
        {/* {table.table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <Table.Column key={header.id} colSpan={header.colSpan}>
                  <DataTableColumnHeader
                    column={header.column}
                    title={header.column.columnDef.header?.toString() ?? ""}
                  />
                </Table.Column>
              );
            })}
          </tr>
        ))} */}
        {/* {table.table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <Table.Column key={header.id} colSpan={header.colSpan}>
                  <DataTableColumnHeader
                    column={header.column}
                    title={header.column.columnDef.header?.toString() ?? ""}
                  />
                </Table.Column>
              );
            })}
          </tr>
        ))} */}
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
              {Children.map(children as never, ({ props }: { props: ColumnProps }) => {
                const cell = cells.find((cell) => cell.column.id === props.accessor);

                if (table.columns.length > 0 && !cell) return null;

                return <ColumnBody {...props} row={row.original} />;
              })}
            </Table.Row>
          );
        })}
        {/* {table.table.getRowModel().rows.map((row) => {
          const entries = Object.entries(variant?.(row.original) ?? {}) as Array<
            [NonNullable<VariantProps<typeof rowVariants>["variant"]>, boolean]
          >;
          const selectedVariant = entries.find(([, value]) => value)?.[0];
          return (
            <Table.Row key={row.id} variant={selectedVariant}>
              {row.getVisibleCells().map((cell) => {
                const col = columns.find((col) => col.accessor === cell.column.id);
                if (col) return <ColumnBody key={cell.id} {...col} row={row.original} />;

                return (
                  <Table.Cell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Table.Cell>
                );
              })}
            </Table.Row>
          );
        })} */}
      </tbody>
    </>
  );
}

export const DataTable2 = {
  Root: DataTableRoot,
  Header: TableContainer.Header,
  Title,
  Config: DataTableViewOptions,
  Content: Table,
  // Columns: DataTableColumns,
  Column: ColumnBody,
  // Body: Table.Body,
  // Row: DataTableRow,
};

export default function Example() {
  const table = useTable2({
    data,
  });
  const [counter, setCounter] = useState(0);

  return (
    <div className="space-y-16 p-16">
      <button onClick={() => setCounter((c) => c + 1)}>Conuter: {counter}</button>
      <DataTableRoot table={table} variant="narrow">
        <DataTable2.Header>
          <DataTable2.Title>Test</DataTable2.Title>
          <DataTable2.Config />
        </DataTable2.Header>
        <DataTable2.Content>
          <Rows variant={(row) => ({ main: row.type === "header", dark: row.type === "footer" })}>
            <DataTable.Column accessor="date" label="Fecha" isDate />
            <DataTable.Column accessor="asset" label="Activo" align="center" />
            <DataTable.Column accessor="amount" label="Monto Pesos" isNumber />
            <DataTable.Column accessor="actions" label="Acciones" align="center">
              {({ row, variant }) => (
                <div className="inline-block rounded-full bg-red-100 px-2 text-red-700">
                  {(row.amount as number) * 2} {variant}
                </div>
              )}
            </DataTable.Column>
          </Rows>
        </DataTable2.Content>
      </DataTableRoot>
      TEST
    </div>
  );
}
