const data = [
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
];

type Row = {
  date: Date | string;
  asset?: string;
  quantity?: number;
  amount: number;
  type?: string;
};

import { Button } from "@/components/ui/button";
import { useTable } from "@/lib/datatable";

import { useState } from "react";

export default function Example() {
  const [table, DataTable] = useTable({
    data: data as unknown as Row[],
    sortMinDepth: 1,
  });
  const [counter, setCounter] = useState(0);

  return (
    <div className="space-y-16 p-16">
      <DataTable.Root table={table} variant="narrow">
        <DataTable.Header>
          <DataTable.Title>Posicion </DataTable.Title>
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Content>
          <DataTable.Rows variant={(row) => ({ main: row.type === "header", dark: row.type === "footer" })}>
            <DataTable.Column accessor="date" label="Fecha" isDate></DataTable.Column>
            <DataTable.Column accessor="asset" label="Activo" align="center" />
            <DataTable.Column accessor="amount" label="Monto Pesos" isNumber />
            <DataTable.Column accessorAlias="actions" label="Acciones Globales" align="center">
              {({ row }) => (
                <Button size="sm" onClick={() => setCounter((p) => ++p)}>
                  {row.amount} Contador: {counter}
                </Button>
              )}
            </DataTable.Column>
            <DataTable.Column accessorAlias="test" label="Acciones" align="center">
              {RowActions}
            </DataTable.Column>
          </DataTable.Rows>
        </DataTable.Content>
      </DataTable.Root>
      TEST
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
