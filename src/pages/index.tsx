const disp = generateData(10);
const noDisp = generateData(5);

const DATA = [
  {
    category: "header",
    type: "Cartera Disponible",
    amountArs: 9118459.54,
    subRows: [
      {
        category: "subheader",
        type: "Especies",
        amountArs: 9035328.9,
        subRows: disp,
      },
      {
        category: "subheader",
        type: "Moneda",
        amountArs: 83130.64,
        subRows: noDisp,
      },
    ],
  },
  {
    category: "footer",
    type: "Totales",
    amountArs: 9118459.54,
  },
];

type Row = {
  date: Date | string;
  asset?: string;
  quantity?: number;
  amount: number;
  type?: string;
};

import { DataTablePagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { generateData } from "@/faker";
import { useTable } from "@/lib/datatable";

import { useEffect, useState } from "react";

export default function Example() {
  const [data, setData] = useState<typeof DATA>();

  useEffect(() => {
    setTimeout(() => {
      setData(DATA);
    }, 2000);
  }, []);

  type Data = Array<(typeof disp)[number] & { category?: string }>;

  const [table, DataTable] = useTable({
    key: "position",
    data: data as Data,
    sortMinDepth: 2,
    pagination: 20,
  });

  return (
    <div className="space-y-16 py-16 sm:p-16">
      <DataTable.Root table={table} variant="narrow">
        <DataTable.Header>
          {/* <DataTable.Title>Posicion</DataTable.Title> */}
          <DataTable.Search />
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Content>
          <DataTable.Rows
            variant={(row) => ({
              main: row?.category === "header",
              gray: row?.category === "subheader",
              dark: row?.category === "footer",
            })}
          >
            <DataTable.Column title collapsable accessor="type" label="Tipo" align="center" />
            <DataTable.Column accessor="title" label="Concepto" align="center" />
            <DataTable.Column accessor="code" label="Codigo" align="right" />
            <DataTable.Column accessor="abbreviation" label="Abreviatura" align="center" />
            <DataTable.Column accessor="quantity" label="Cantidad" align="right" />
            <DataTable.Column accessor="price" label="Precio" isNumber />
            <DataTable.Column accessor="date" label="Fecha" isDate />
            <DataTable.Column accessor="amount" label="Monto" isNumber />
            <DataTable.Column accessor="amountArs" label="Monto Pesos" isNumber />
            <DataTable.Column accessorAlias="actions" label="Acciones" align="center">
              {RowActions}
            </DataTable.Column>
          </DataTable.Rows>
        </DataTable.Content>
        <DataTable.Loading height="h-80">Cargando Posicion...</DataTable.Loading>
        <DataTable.Empty height="h-80">
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
