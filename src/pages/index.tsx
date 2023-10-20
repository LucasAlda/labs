import { DataTable, useTable } from "@/lib/datatable";
import Head from "next/head";

const data = [
  {
    date: new Date("2021-01-01"),
    asset: "AAPL",
    quantity: 10,
    amount: 100,
  },
  {
    date: new Date("2021-01-01"),
    asset: "MELI",
    quantity: 5,
    amount: 200,
  },
  {
    date: new Date("2021-01-01"),
    asset: "TSLA",
    quantity: 3,
    amount: 50,
  },
  {
    date: "Total",
    header: true,
    amount: 350,
  },
];

export default function Example() {
  const table = useTable({
    tableId: "TABLE",
    rows: data,
    filters: {
      global: {
        filterFunc: (filter, row, variant) => row.amount < Number(filter) || variant !== "none",
        value: "150",
      },
    },
    rowVariant: {
      main: (row) => row.header,
    },
    // hideColumns: {},
    // sort: { by: "date", order: "asc" },
  });

  // TODO:
  // - visibility
  // - Headers titles
  // - sort
  // - save
  // - premade filters
  // - config
  // - pagination

  return (
    <div className="space-y-16 p-16">
      <DataTable.Root table={table}>
        <DataTable.Header>
          <DataTable.Title>Test</DataTable.Title>
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Content>
          <DataTable.Columns>
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
          </DataTable.Columns>
        </DataTable.Content>
      </DataTable.Root>
      <DataTable.Root table={table}>
        <DataTable.Header>
          <DataTable.Title>Test</DataTable.Title>
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Content>
          <DataTable.Columns>
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
          </DataTable.Columns>
          <DataTable.Body>
            {table.rows.map(({ row, variant }) => (
              <DataTable.Row row={row} variant={variant as never}>
                {/* <ColumnBody label="" accessor="date" isDate />
                <ColumnBody label="" accessor="asset" align="center" />
                <ColumnBody label="" accessor="amount" isNumber />
                <ColumnBody label="" accessor="actions" align="center">
                  <div className="inline-block rounded-full bg-red-100 px-2 text-red-700">
                    {(row.amount as number) * 2} {variant}
                  </div>
                </ColumnBody> */}
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </DataTable.Content>
      </DataTable.Root>
    </div>
  );
}
