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

type Row = (typeof disp)[number] & { category?: string };

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

  const [table, DataTable] = useTable({
    data: data as Array<Row>,
    sortMinDepth: 2,
    pagination: 20,
    visibility: {
      sm: {
        type: false,
        amount: false,
        category: false,
        code: false,
        date: false,
        id: false,
        title: false,
        actions: false,
      },
    },
  });

  const [condensed, setCondensed] = useState(false);

  return (
    <div className="space-y-16 py-16 sm:p-16">
      <DataTable.Root table={table} variant="narrow">
        <DataTable.Header>
          <Button onClick={() => setCondensed((p) => !p)} variant={"outline"} size="sm">
            {condensed ? "Condensed" : "Condense"}
          </Button>
          <DataTable.Search />
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Content condensed={condensed}>
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
              {({ row, variant }) =>
                variant === "none" && (
                  <DataTable.Action onClick={() => alert(JSON.stringify(row, null, 2))}>Button</DataTable.Action>
                )
              }
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
