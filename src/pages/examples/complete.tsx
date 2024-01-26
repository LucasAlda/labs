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
];

type Row = (typeof disp)[number] & { category?: string };

import { useTable, useView } from "@/components/datatable/hooks";
import { Button } from "@/components/ui/button";
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { generateData } from "@/faker";

import { useEffect, useState } from "react";

export default function Example() {
  const [data, setData] = useState<typeof DATA>();

  useEffect(() => {
    setTimeout(() => {
      setData(DATA);
    }, 2000);
  }, []);

  const view = useView<keyof Row>("test", {
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
    data: data as unknown as Array<Row>,
    minDepth: 1,
    pagination: 20,
    view,
    filter: (row, search, filter) => {
      if (search === "secret") return row.original.type === "CEDEARS";
      return filter(row);
    },
    sort: {
      actionsCol: (a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.getTime() - a.date.getTime();
      },
    },
  });

  const [condensed, setCondensed] = useState(true);

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
        <DataTable.Table condensed="sm">
          <tbody>
            {table.getRows().map(({ ctx, row }) => (
              <DataTable.Row
                ctx={ctx}
                key={ctx.id}
                onClick={() => alert(`row ${row.abbreviation}`)}
                variant={
                  row?.category === "header"
                    ? "main"
                    : row?.category === "subheader"
                    ? "gray"
                    : row?.category === "footer"
                    ? "dark"
                    : "none"
                }
              >
                <DataTable.Cell title collapsible accessor="type" label="Tipo" align="center" />
                <DataTable.Cell accessor="title" label="Concepto" align="center" />
                <DataTable.Cell accessor="code" label="Codigo" align="right">
                  {({ row }) => <div>{row.code}</div>}
                </DataTable.Cell>
                <DataTable.Cell accessor="abbreviation" label="Abreviatura" align="center" />
                <DataTable.Cell accessor="quantity" label="Cantidad" align="right" />
                <DataTable.Cell accessor="price" label="Precio" isNumber />
                <DataTable.Cell accessor="date" label="Fecha" isDate />
                <DataTable.Cell accessor="amount" label="Monto" isNumber />
                <DataTable.Cell accessor="amountArs" footer={table.sum("amountArs")} label="Monto Pesos" isNumber />
                <DataTable.Buttons
                  showEmpty={({ variant }) => variant !== "none"}
                  accessorAlias="actionsCol"
                  label="Acciones"
                >
                  <DataTable.Action onClick={({ row }) => alert(`${row.amount} 2`)}>Amount</DataTable.Action>
                  <DataTable.Action onClick={({ row }) => alert(`${row.price} 1`)}>Price</DataTable.Action>
                </DataTable.Buttons>
                <DataTable.Dropdown
                  showEmpty={({ variant }) => variant !== "none"}
                  accessorAlias="actionCol2"
                  label="Acciones2"
                >
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DataTable.Action onClick={({ row }) => alert(`${row.abbreviation} 1`)}>
                        Abbreviation
                      </DataTable.Action>
                      <DataTable.Action onClick={({ row }) => alert(`${row.amount} 2`)}>Amount</DataTable.Action>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DataTable.Dropdown>
              </DataTable.Row>
            ))}
          </tbody>
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
