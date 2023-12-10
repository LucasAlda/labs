const DATA = [
  {
    type: "header",
    date: "Cartera Disponible",
    amount: 500000,

    subRows: [
      {
        type: 12,
        date: new Date("2023-01-01"),
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
        date: new Date("2021-02-01"),
        asset: "TSLA",
        quantity: 3,
        lol: 1,
        amount: 50,
      },
    ],
  },
  {
    type: "header",
    date: "Cartera Disponible",
    amount: 500000,

    subRows: [
      {
        type: 12,
        date: new Date("2023-01-01"),
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
        date: new Date("2021-02-01"),
        asset: "TSLA",
        quantity: 3,
        lol: 1,
        amount: 50,
      },
    ],
  },
  {
    type: "header",
    date: "Cartera Disponible",
    amount: 500000,

    subRows: [
      {
        type: 12,
        date: new Date("2023-01-01"),
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
        date: new Date("2021-02-01"),
        asset: "TSLA",
        quantity: 3,
        lol: 1,
        amount: 50,
      },
    ],
  },
  {
    type: "footer",
    date: "Total",
    header: true,
    amount: 350,
    onlyHeader: true,
    subRows: [],
  },
] as Array<Row & { subRows: Array<Row> }>;

type Row = {
  date: Date | string;
  asset?: string;
  quantity?: number;
  amount: number;
  type?: string;
};

import { DataTablePagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { useTable } from "@/lib/datatable";

import { useEffect, useState } from "react";

export default function Example() {
  const [data, setData] = useState<typeof DATA>();

  useEffect(() => {
    setTimeout(() => {
      setData(DATA);
    }, 2000);
  }, []);

  const [table, DataTable] = useTable<Array<Row>>({
    key: "position",
    data: data,
    sortMinDepth: 1,
    prerender: false,
    pagination: 10,
  });
  const [counter, setCounter] = useState(0);

  console.log(table.getSelected());
  return (
    <div className="space-y-16 p-16">
      <DataTable.Root table={table} variant="card">
        <DataTable.Header>
          <DataTable.Title>Posicion</DataTable.Title>
          <Button size="sm" onClick={() => setCounter((p) => ++p)}>
            {counter}
          </Button>
          <DataTable.Search />
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Content>
          <DataTable.Rows variant={(row) => ({ main: row.type === "header", dark: row.type === "footer" })}>
            <DataTable.Column accessorAlias="select" label="Seleccionar" align="center">
              {({ controller }) => (
                <input
                  type="checkbox"
                  checked={controller.getIsSelected()}
                  onChange={(e) => controller.toggleSelected(e.target.checked)}
                />
              )}
            </DataTable.Column>
            <DataTable.Column collapsable accessor="date" label="Fecha" isDate></DataTable.Column>
            <DataTable.Column accessor="asset" label="Activo" align="center" />
            <DataTable.Column accessor="amount" label="Monto Pesos" isNumber />
            <DataTable.Column accessorAlias="actions" label="Acciones Globales" align="center">
              {({ row }) => (
                <Button size="sm" onClick={() => setCounter((p) => ++p)}>
                  {row.amount} Contador: {counter}
                </Button>
              )}
            </DataTable.Column>
            <DataTable.Column accessor="quantity" label="Acciones" align="center">
              {RowActions}
            </DataTable.Column>
          </DataTable.Rows>
        </DataTable.Content>
        <DataTable.Loading height="h-60">Cargando Posicion...</DataTable.Loading>
        <DataTable.Empty height="h-60">
          <span>No tiene Posición</span>
          <Button size="sm">Comprar</Button>
        </DataTable.Empty>
        <DataTablePagination />
      </DataTable.Root>
    </div>
  );
}

const RowActions = ({ row }: { row: Row }) => {
  const [counter, setCounter] = useState(0);

  return (
    <Button size="sm" onClick={() => setCounter((p) => ++p)}>
      {row.amount} Contador: {counter}
    </Button>
  );
};
