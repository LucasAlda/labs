import { Table, TableRowProps, rowVariants, useTableRowContext } from "@/lib/table";
import { VariantProps } from "class-variance-authority";
import {
  Children,
  createContext,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";

type DataTableContext = {
  columns: ColumnProps[];
  addColumn: (column: ColumnProps) => void;
  removeColumn: (column: ColumnProps) => void;
  table: ReturnType<typeof useTable>;
  render: "columns" | "manual" | "auto";
};

const DataTableCtx = createContext<DataTableContext>(null as unknown as DataTableContext);
const useDataTableCtx = () => useContext(DataTableCtx);

function DataTableRoot({
  children,
  table,
  render = "columns",
}: {
  children: ReactNode;
  table: DataTableContext["table"];
  render?: "columns" | "manual" | "auto";
}) {
  const [columns, setColumns] = useState<ColumnProps[]>([]);

  function addColumn(column: ColumnProps) {
    setColumns((prev) => [...prev, column]);
  }

  function removeColumn(column: ColumnProps) {
    setColumns((prev) => prev.filter((col) => col.accessor !== column.accessor));
  }

  return (
    <DataTableCtx.Provider value={{ columns, addColumn, removeColumn, table, render }}>
      <div>{children}</div>
    </DataTableCtx.Provider>
  );
}

function Dummy({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

function DataTableColumns({ children }: { children: ReactNode; title?: string }) {
  const ctx = useDataTableCtx();
  const columns = Children.map(children as never, ({ props }: { props: ColumnProps }) => props);

  return (
    <>
      <Table.Head>
        {columns.map((col) => (
          <ColumnHeader key={col.accessor} {...col} />
        ))}
      </Table.Head>
      {(ctx.render === "columns" || ctx.render === "auto") && (
        <Table.Body>
          {ctx.table.rows.map(({ row, variant }) => (
            <DataTableRow row={row} variant={variant as never}>
              {columns.map((col) => (
                <ColumnBody {...col} />
              ))}
            </DataTableRow>
          ))}
        </Table.Body>
      )}
    </>
  );
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

// TODO: MOVER LA LOGICA ESTA AL DATACONTENT o ALGO SIMILAR
function ColumnHeader(props: ColumnProps) {
  const ctx = useDataTableCtx();

  useEffect(() => {
    ctx.addColumn(props);
    return () => ctx.removeColumn(props);
  }, []);

  return (
    <Table.Column {...props} key={props.accessor}>
      {props.label}
    </Table.Column>
  );
}

function ColumnBody(props: ColumnProps) {
  const dataTableRowctx = useDataTableRowContext();
  const tableRowctx = useTableRowContext();

  const children =
    typeof props.children === "function"
      ? props.children({ row: dataTableRowctx.row, variant: tableRowctx.variant ?? "none" })
      : props.children;

  return <Table.Cell {...props}>{children ?? (dataTableRowctx.row[props.accessor] as ReactNode)}</Table.Cell>;
}

type DataTableRowContextType = {
  row: Record<string, unknown>;
};
const DataTableRowContext = createContext<DataTableRowContextType>({ row: {} });
const useDataTableRowContext = () => useContext(DataTableRowContext);

function DataTableRow({ row, ...tableRowProps }: TableRowProps & DataTableRowContextType) {
  return (
    <DataTableRowContext.Provider value={{ row }}>
      <Table.Row {...tableRowProps} />
    </DataTableRowContext.Provider>
  );
}

export const DataTable = {
  Root: DataTableRoot,
  Header: Dummy,
  Title: Dummy,
  Config: Dummy,
  Content: Table,
  Columns: DataTableColumns,
  Column: ColumnBody,
  Body: Table.Body,
  Row: DataTableRow,
};

export const useTable = <
  TRow extends Record<string, unknown>,
  TFilters extends {
    [k: string]: {
      value: string;
      filterFunc: (filter: string, row: TRow, variant: NonNullable<TableRowProps["variant"]>) => boolean;
    };
  }
>(props: {
  tableId: string;
  rows: TRow[] | undefined;
  rowVariant?: { [k in NonNullable<TableRowProps["variant"]>]?: (row: TRow) => boolean | undefined };

  filters?: TFilters;
}) => {
  const filteredRows = useMemo(
    () =>
      (props.rows || [])
        .map((row) => {
          const variant = (Object.entries(props.rowVariant ?? {}).find(([, fn]) => fn(row))?.[0] ??
            "none") as NonNullable<TableRowProps["variant"]>;
          return {
            row,
            variant,
          };
        })
        .filter(({ row, variant }) => {
          return Object.values(props.filters ?? {}).every((filter) => {
            return filter.filterFunc(filter.value, row, variant);
          });
        }),
    [props.filters, props.rowVariant, props.rows]
  );

  return useMemo(
    () => ({
      rows: filteredRows,
    }),
    [filteredRows]
  );
};
