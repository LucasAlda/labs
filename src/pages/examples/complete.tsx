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
    variant: (row) => ({
      main: row.category === "header",
      gray: row.category === "subheader",
      dark: row.category === "footer",
    }),
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
          <DataTable.Cols>
            <DataTable.Col label="Tipo" accessor="type" align="center" />
            <DataTable.Col label="Descripcion" accessor="title" align="center" />
            <DataTable.Col label="Codigo" accessor="code" align="right" />
            <DataTable.Col label="Abreviatura" accessor="abbreviation" align="center" />
            <DataTable.Col label="Cantidad" accessor="quantity" align="right" />
            <DataTable.Col label="Precio" accessor="price" isNumber />
            <DataTable.Col label="Fecha" accessor="date" isDate />
            <DataTable.Col label="Monto" accessor="amount" isNumber />
            <DataTable.Col label="Monto Pesos" accessor="amountArs" isNumber />
            <DataTable.Col label="Acciones" accessorAlias="actionsCol" />
            <DataTable.Col label="Acciones 2" type="dropdown" accessorAlias="actionCol2" />
          </DataTable.Cols>
          {table.getRows().map(({ ctx, row, variant }) => (
            <DataTable.Row ctx={ctx} key={ctx.id} onClick={() => alert(`row ${row.abbreviation}`)} variant={variant}>
              <DataTable.Cell title collapsible accessor="type" align="center" />
              <DataTable.Cell accessor="title" align="center" />
              <DataTable.Cell accessor="code" align="right">
                <div>{row.code}</div>
              </DataTable.Cell>
              <DataTable.Cell accessor="abbreviation" align="center" />
              <DataTable.Cell accessor="quantity" align="right" />
              <DataTable.Cell accessor="price" isNumber />
              <DataTable.Cell accessor="date" isDate />
              <DataTable.Cell accessor="amount" isNumber />
              <DataTable.Cell accessor="amountArs" footer={table.sum("amountArs")} isNumber />
              <DataTable.Buttons showEmpty={variant !== "none"} accessorAlias="actionsCol">
                <DataTable.Action onClick={() => alert(`${row.amount} 2`)}>Amount</DataTable.Action>
                <DataTable.Action onClick={() => alert(`${row.price} 1`)}>Price</DataTable.Action>
              </DataTable.Buttons>
              <DataTable.Dropdown showEmpty={variant !== "none"} accessorAlias="actionCol2">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DataTable.Action onClick={() => alert(`${row.abbreviation} 1`)}>Abbreviation</DataTable.Action>
                    <DataTable.Action onClick={() => alert(`${row.amount} 2`)}>Amount</DataTable.Action>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DataTable.Dropdown>
            </DataTable.Row>
          ))}
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
