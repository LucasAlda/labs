/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, type ButtonProps } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Cell,
  flexRender,
  type HeaderContext,
  type CellContext,
  getSortedRowModel,
} from "@tanstack/react-table";
import { format, isDate } from "date-fns";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? ObjectType[Key] extends Date
      ? `${Key}`
      : `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TRowData = Record<string, unknown>;

// TODO fix later
type MyColumn<TRow extends TRowData> = ColumnDef<TRow, unknown> & {
  meta: {
    align?: "left" | "center" | "right";
    type?: string;
    onClick?: (props: { row: TRow; cell: unknown; tCell: Cell<TRow, unknown>; tRow: Row<TRow> }) => void;
  };
};

interface CellCallbackProps<TRow, TValue> {
  cell: TValue;
  tCell: Cell<TRow, TValue>;
  row: TRow;
  tRow: Row<TRow>;
}

interface BaseColumnOptions<TRow extends TRowData, TValue> {
  label?: string;
  align?: "left" | "center" | "right";
  footer?: ReactNode | ((props: HeaderContext<TRow, unknown>) => ReactNode);
  onClick?: (props: CellCallbackProps<TRow, TValue>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function baseColumn(accessor: string, props: BaseColumnOptions<any, any>) {
  return {
    header: props.label ?? accessor,
    ...(typeof accessor === "string" ? { accessorKey: accessor } : { accessorFn: accessor }),
    footer: props.footer as never,
    meta: {
      align: props.align,
      onClick: props.onClick as never,
    },
  };
}

interface TextColumnOptions<TRow extends TRowData, TValue> extends BaseColumnOptions<TRow, TValue> {
  format?: (props: CellCallbackProps<TRow, TValue>) => ReactNode;
}
function text<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor | (() => string),
  props: TextColumnOptions<TRow, TRow[TAccessor]> = {}
): MyColumn<TRow> {
  const column: MyColumn<TRow> = baseColumn(typeof accessor === "string" ? accessor : accessor(), props);
  column.meta.type = "text";

  if (props.format) {
    column.cell = ({ row, getValue, cell }) =>
      props.format?.({ row: row.original, cell: getValue(), tCell: cell, tRow: row } as never);
  }

  return column;
}

interface NumberColumnOptions<TRow extends TRowData, TValue> extends BaseColumnOptions<TRow, TValue> {
  format?: (props: CellCallbackProps<TRow, TValue>) => ReactNode;
  decimals?: number;
  empty?: string;
  currency?: string;
}
function number<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor | (() => string),
  props: NumberColumnOptions<TRow, TRow[TAccessor]> = {}
): MyColumn<TRow> {
  const column: MyColumn<TRow> = baseColumn(typeof accessor === "string" ? accessor : accessor(), props);

  column.meta.type = "number";
  column.meta.align ??= "right";

  column.cell = ({ row, getValue, cell }) => {
    if (props.format) {
      return props.format?.({ row: row.original, cell: getValue(), tCell: cell, tRow: row } as never);
    }
    return (
      (props.currency ? props.currency + " " : "") +
      formatNumber(Number(getValue()), { decimals: props.decimals, emptyValues: props.empty })
    );
  };

  return column;
}

interface DateColumnOptions<TRow extends TRowData, TValue> extends BaseColumnOptions<TRow, TValue> {
  format?: (props: CellCallbackProps<TRow, TValue>) => ReactNode;
  separator?: string;
  date?: boolean;
  time?: boolean;
}
function date<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor | (() => string),
  props: DateColumnOptions<TRow, TRow[TAccessor]> = {}
): MyColumn<TRow> {
  const column: MyColumn<TRow> = baseColumn(typeof accessor === "string" ? accessor : accessor(), props);

  column.meta.type = "number";
  column.meta.align ??= "center";

  column.cell = ({ row, getValue, cell }) => {
    if (props.format) {
      return props.format?.({ row: row.original, cell: getValue(), tCell: cell, tRow: row } as never);
    }

    const date = getValue() as Date;
    if (!isDate(date)) {
      if (date) console.log("Invalid date at row:", row.index, date);
      return date;
    }

    const datetime = format(date, `dd${props.separator ?? "-"}MM${props.separator ?? "-"}yyyy HH:mm`);
    if (props.date === false) {
      return datetime.split(" ")[1];
    } else if (!props.time) {
      return datetime.split(" ")[0];
    } else return datetime;
  };

  return column;
}

function actions<TRow extends TRowData>(
  actions: Array<{
    label: string;
    variant?: ButtonProps["variant"];
    action: (props: { row: TRow; tRow: Row<TRow> }) => void;
  }>,
  props: BaseColumnOptions<TRow, unknown> = {}
): MyColumn<TRow> {
  const column: MyColumn<TRow> = baseColumn(props?.label ?? "actions", props);

  column.enableSorting = false;
  column.meta.type = "actions";
  column.header = props?.label ?? "Acciones";

  column.cell = ({ row }) => {
    return (
      <div className="flex gap-1">
        {actions.map((action, index) => {
          return (
            <Button
              key={index}
              variant={action.variant}
              size={"sm"}
              onClick={() => action.action({ row: row.original, tRow: row })}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  return column;
}

function custom<TRow extends TRowData, TAccessor extends string>(
  accessor: TAccessor,
  props: BaseColumnOptions<TRow, TRow[TAccessor]> = {},
  component: (props: CellCallbackProps<TRow, TRow[TAccessor]>) => ReactNode
): MyColumn<TRow> {
  const column: MyColumn<TRow> = baseColumn(accessor, props);

  column.cell = ({ row, getValue, cell }) =>
    component({ row: row.original, cell: getValue(), tCell: cell, tRow: row } as never);
  column.meta.type = "custom";

  return column;
}

function total<TRow extends TRowData, TAccessor extends keyof TRow>(accessor?: TAccessor) {
  return ({ table, column }: HeaderContext<TRow, unknown>) => {
    return table
      .getFilteredRowModel()
      .rows.reduce((acc, curr) => Number(acc) + Number(curr.getValue((accessor as string) ?? column.id)), 0);
  };
}

type ColumnsHelperFunction<T extends TRowData> = (d: {
  text: typeof text;
  date: typeof date;
  number: typeof number;
  custom: typeof custom;
  total: typeof total;
  actions: typeof actions;
}) => MyColumn<T>[];
const columnHelpers = { text, date, number, actions, custom, total: total };

export function useTableHook<TRow extends TRowData>(props: {
  data: TRow[];
  columns: ColumnsHelperFunction<TRow>;
  columnsDeps?: unknown[];
  onRowClick?: (props: { row: TRow; tRow: Row<TRow> }) => void;
}) {
  const _columns = props.columns;
  const frozenColumns = useMemo(() => {
    return _columns(columnHelpers) ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(props.columnsDeps ?? [])]);

  const tanstack = useReactTable({
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columns: frozenColumns,
    data: props.data,
  });

  return {
    columns: frozenColumns,
    _columns,
    tanstack,
    onRowClick: props.onRowClick,
  };
}

// TODO fix d.total for nested keys
// TODO fix nested keys inference

export function Example() {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hook = useTableHook({
    data,
    columns: (d) => [
      d.text("name"),
      d.text("address.city", { label: "City", align: "left" }),
      d.text("address.number", { label: "City", align: "left", footer: d.total("age") }),
      d.date("birth", { label: "Birth", separator: "/", time: true }),
      d.number("money", { label: "Money", decimals: 3, currency: "u$s", empty: "" }),
      d.custom("age2", { label: "Custom" }, ({ row, cell }) => {
        return <div className="bg-red-100">Custom {row.age}</div>;
      }),
      d.actions([
        { label: "Edit", action: ({ row }) => alert("Edit " + row.name) },
        { label: "Delete", variant: "destructive", action: ({ row }) => alert("Delete " + row.name) },
      ]),
      { accessorKey: "age", meta: {} },
    ],
    onRowClick: ({ row }) => {
      alert("Row clicked: " + row.name);
    },
    // variant: row => {
    //   if (row.age > 40) {
    //     return 'light'
    //   }
    //   return 'none'
    // },
  });

  return (
    <div>
      <div>Counter: {counter}</div>
      <pre> {JSON.stringify(hook.columns, null, 2)}</pre>
      <table>
        <thead>
          {hook.tanstack.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                        onClick={header.column.getToggleSortingHandler()}
                        title={
                          header.column.getCanSort()
                            ? header.column.getNextSortingOrder() === "asc"
                              ? "Sort ascending"
                              : header.column.getNextSortingOrder() === "desc"
                              ? "Sort descending"
                              : "Clear sort"
                            : undefined
                        }
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {hook.tanstack.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id} onClick={() => hook.onRowClick?.({ row: row.original, tRow: row })}>
                {row.getVisibleCells().map((cell) => {
                  const col = cell.column.columnDef as MyColumn<never>;
                  return (
                    <td
                      key={cell.id}
                      style={{ textAlign: col.meta.align }}
                      onClick={() =>
                        col.meta.onClick?.({
                          cell: cell.getValue(),
                          row: row.original as never,
                          tCell: cell as never,
                          tRow: row as never,
                        })
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {hook.tanstack.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <div>{hook.tanstack.getRowModel().rows.length.toLocaleString()} Rows</div>{" "}
    </div>
  );
}

const data = [
  {
    name: "John",
    age: 42,
    money: 1000,
    birth: new Date("1980-01-01"),
    address: { number: 1, city: "New York", street: "5th Avenue" },
  },
  {
    name: "Jane",
    age: 35,
    money: 2000,
    birth: new Date("1987-05-05"),
    address: { number: 2, city: "Los Angeles", street: "7th Avenue" },
  },
  {
    name: "Joe",
    age: 25,
    money: 3000,
    birth: new Date("1995-11-15"),
    address: { number: 3, city: "Chicago", street: "9th Avenue" },
  },
  {
    name: "Jill",
    age: 19,
    money: 8765.43,
    birth: new Date("2001-03-25"),
    address: { number: 4, city: "Houston", street: "11th Avenue" },
  },
  {
    name: "Jack",
    age: 56,
    money: 45678.9,
    birth: new Date("1965-07-15"),
    address: { number: 5, city: "Phoenix", street: "13th Avenue" },
  },
  {
    name: "Jenny",
    age: 32,
    money: 43578.43,
    birth: new Date("1989-09-05"),
    address: { number: 6, city: "Philadelphia", street: "15th Avenue" },
  },
  {
    name: "Jeff",
    age: 45,
    money: 12345.67,
    birth: new Date("1976-02-15"),
    address: { number: 7, city: "San Antonio", street: "17th Avenue" },
  },
  {
    name: "Jessica",
    age: 30,
    money: 34567.89,
    birth: new Date("1993-04-25"),
    address: { number: 8, city: "San Diego", street: "19th Avenue" },
  },
];
