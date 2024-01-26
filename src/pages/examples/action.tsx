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

import { useTable, useView } from "@/components/datatable/hooks";
import { Button } from "@/components/ui/button";
import { generateData } from "@/faker";

import { useEffect, useState } from "react";

export default function Example() {
  const [data, setData] = useState<typeof DATA>();

  useEffect(() => {
    setTimeout(() => {
      setData(DATA);
    }, 2000);
  }, []);

  const view = useView("test", {
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
  });

  const [table, DataTable] = useTable({
    data: data as Array<Row>,
    minDepth: 2,
    pagination: 20,
    view,
  });

  return (
    <div className="space-y-16 py-16 sm:p-16">
      <DataTable.Root table={table} variant="narrow">
        <DataTable.Header>
          <DataTable.Search />
          <DataTable.Config />
        </DataTable.Header>
        <DataTable.Table>
          <DataTable.Rows
            variant={(row) => ({
              main: row?.category === "header",
              gray: row?.category === "subheader",
              dark: row?.category === "footer",
            })}
          >
            <DataTable.Cell title collapsible accessor="type" label="Tipo" align="center" />
            <DataTable.Cell accessor="title" label="Concepto" align="center" />
            <DataTable.Cell accessor="code" label="Codigo" align="right" />
            <DataTable.Cell accessor="abbreviation" label="Abreviatura" align="center" />
            <DataTable.Cell accessor="quantity" label="Cantidad" align="right" />
            <DataTable.Cell accessor="price" label="Precio" isNumber />
            <DataTable.Cell accessor="date" label="Fecha" isDate />
            <DataTable.Cell accessor="amount" label="Monto" isNumber />
            <DataTable.Cell accessor="amountArs" label="Monto Pesos" isNumber />
            <DataTable.Buttons accessorAlias="actionsCol" label="Acciones">
              <DataTable.Action onClick={({ row }) => alert(`${row.amount} 2`)}>Amount</DataTable.Action>
            </DataTable.Buttons>
          </DataTable.Rows>
        </DataTable.Table>
        <DataTable.Loading height="h-80">Cargando Posicion...</DataTable.Loading>
        <DataTable.Empty height="h-80">
          <span>No tiene Posición</span>
          <Button size="sm">Comprar</Button>
        </DataTable.Empty>
        <DataTable.Pagination />
      </DataTable.Root>
    </div>
  );
}
