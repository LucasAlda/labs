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
} from "@tanstack/react-table";
import { format } from "date-fns";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type TRowData = Record<string, unknown>;

// TODO fix later
type MyColumn<TRow extends TRowData> = ColumnDef<TRow, unknown> & {
  meta: {
    align?: "left" | "center" | "right";
    onClick?: (props: { row: TRow; cell: unknown; tCell: Cell<TRow, unknown>; tRow: Row<TRow> }) => void;
  };
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? ObjectType[Key] extends Date
      ? `${Key}`
      : `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

function date<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor | (() => string),
  props: {
    label: string;
    align?: "left" | "center" | "right";
    footer?: ReactNode | ((props: HeaderContext<TRow, unknown>) => ReactNode);
    cell?: () => ReactNode;
    onClick?: (props: {
      row: TRow;
      cell: TRow[TAccessor];
      tCell: Cell<TRow, TRow[TAccessor]>;
      tRow: Row<TRow>;
    }) => void;
    separator?: string;
    date?: boolean;
    time?: boolean;
  }
): MyColumn<TRow> {
  return {
    header: props.label,
    ...(typeof accessor === "string" ? { accessorKey: accessor } : { accessorFn: accessor }),
    footer: props.footer as never,
    cell:
      props.cell ??
      (({ getValue }) => {
        if (props.time && props.date !== false) {
          return format(getValue() as Date, `dd${props.separator ?? "-"}MM${props.separator ?? "-"}yyyy HH:mm`);
        }
        if (props.date === false) {
          return format(getValue() as Date, `HH:mm`);
        }
        return format(getValue() as Date, `dd${props.separator ?? "-"}MM${props.separator ?? "-"}yyyy`);
      }),
    meta: {
      align: props.align ?? "center",
      onClick: props.onClick as never,
    },
  };
}

function number<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor,
  props: {
    label: string;
    align?: "left" | "center" | "right";
    footer?: ReactNode | ((props: HeaderContext<TRow, unknown>) => ReactNode);
    cell?: () => ReactNode;
    onClick?: (props: {
      row: TRow;
      cell: TRow[TAccessor];
      tCell: Cell<TRow, TRow[TAccessor]>;
      tRow: Row<TRow>;
    }) => void;
    decimals?: number;
    empty?: string;
    currency?: string;
  }
): MyColumn<TRow> {
  return {
    header: props.label,
    accessorKey: accessor,
    footer: props.footer as never,
    cell:
      props.cell ??
      (({ getValue }) => {
        return (
          (props.currency ? props.currency + " " : "") +
          formatNumber(Number(getValue()), { decimals: props.decimals, emptyValues: props.empty })
        );
      }),
    meta: {
      align: props.align ?? "right",
      onClick: props.onClick as never,
    },
  };
}

function text<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor,
  props: {
    label: string;
    align?: "left" | "center" | "right";
    footer?: ReactNode | ((props: HeaderContext<TRow, unknown>) => ReactNode);
    cell?: () => ReactNode;
    onClick?: (props: {
      row: TRow;
      cell: TRow[TAccessor];
      tCell: Cell<TRow, TRow[TAccessor]>;
      tRow: Row<TRow>;
    }) => void;
  }
): MyColumn<TRow> {
  return {
    header: props.label,
    accessorKey: accessor,
    footer: props.footer as never,
    ...(props.cell ? { cell: props.cell } : {}),
    meta: {
      align: props.align,
      onClick: props.onClick as never,
    },
  };
}
function actions<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  actions: Array<{
    label: string;
    variant?: ButtonProps["variant"];
    action: (props: { row: TRow; tRow: Row<TRow> }) => void;
  }>,
  props?: {
    label?: string;
    align?: "left" | "center" | "right";
    footer?: ReactNode | ((props: HeaderContext<TRow, unknown>) => ReactNode);
    cell?: () => ReactNode;
    onClick?: (props: {
      row: TRow;
      cell: TRow[TAccessor];
      tCell: Cell<TRow, TRow[TAccessor]>;
      tRow: Row<TRow>;
    }) => void;
  }
): MyColumn<TRow> {
  const accessor = "actions"; // TODO fix later

  return {
    header: props?.label ?? "Actions",
    accessorKey: accessor,
    footer: props?.footer as never,
    cell:
      props?.cell ??
      (({ row }) => {
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
      }),
    meta: {
      align: props?.align,
      onClick: props?.onClick as never,
    },
  };
}

function custom<TRow extends TRowData, TAccessor extends NestedKeyOf<TRow>>(
  accessor: TAccessor | (() => string),
  props: {
    label?: string;
    align?: "left" | "center" | "right";
    footer?: ReactNode | ((props: HeaderContext<TRow, unknown>) => ReactNode);
    onClick?: (props: {
      row: TRow;
      cell: TRow[TAccessor];
      tCell: Cell<TRow, TRow[TAccessor]>;
      tRow: Row<TRow>;
    }) => void;
  } = {},
  component: (props: {
    row: TRow;
    cell: TRow[TAccessor];
    tCell: Cell<TRow, TRow[TAccessor]>;
    tRow: Row<TRow>;
  }) => ReactNode
): MyColumn<TRow> {
  return {
    header: props.label,
    ...(typeof accessor === "string" ? { accessorKey: accessor } : { accessorFn: accessor, header: accessor() }),
    footer: props.footer as never,
    cell: ({ row, getValue, cell }) =>
      component({ row: row.original, cell: getValue(), tCell: cell, tRow: row } as never),
    meta: {
      align: props.align,
      onClick: props.onClick as never,
    },
  };
}

type FooterFn<TRow extends TRowData> = (accessor?: keyof TRow) => (props: HeaderContext<TRow, unknown>) => ReactNode;
const total = (accessor?: string) => {
  return ({ table, column }: HeaderContext<TRowData, unknown>) => {
    return table
      .getFilteredRowModel()
      .rows.reduce((acc, curr) => Number(acc) + Number(curr.getValue(accessor ?? column.id)), 0);
  };
};

type ColumnsHelperFunction<T extends TRowData> = (d: {
  text: typeof text;
  date: typeof date;
  number: typeof number;
  custom: typeof custom;
  total: FooterFn<T>;
  actions: typeof actions;
}) => MyColumn<T>[];

export function useTableHook<TRow extends TRowData>(props: {
  data: TRow[];
  columns: ColumnsHelperFunction<TRow>;
  columnsDeps?: unknown[];
  onRowClick?: (props: { row: TRow; tRow: Row<TRow> }) => void;
}) {
  const _columns = props.columns;
  const frozenColumns = useMemo(() => {
    return _columns({ text, date, number, actions, custom, total: total as never }) ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...(props.columnsDeps ?? [])]);

  const tanstack = useReactTable({
    getCoreRowModel: getCoreRowModel(),
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
      d.date("money", {
        label: "Nacimiento",
        time: true,
        date: false,
        separator: "/",
        onClick: ({ cell }) => alert(cell),
      }),
      d.text("name", { label: "Name", align: "center", onClick: ({ row }) => alert(row.age) }),
      d.text("age", { label: "Age", align: "right", footer: d.total() }),
      d.text("address.city", { label: "City", align: "left" }),
      d.text("address.number", { label: "City", align: "left", footer: d.total() }),
      d.date("birth", { label: "Birth", separator: "/", time: true }),
      d.number("money", { label: "Money", decimals: 3, currency: "u$s", empty: "" }),
      d.custom("name", { label: "Custom" }, ({ row, cell }) => {
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
      <div>Frozen: {JSON.stringify(hook.columns)}</div>
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
          {hook.tanstack
            .getRowModel()
            .rows.slice(0, 10)
            .map((row) => {
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
