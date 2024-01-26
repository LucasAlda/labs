const DATA = generateData(15);

import { useTable } from "@/components/datatable/hooks";
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

  const [table, DataTable] = useTable({
    data,
    pagination: 20,
  });

  return (
    <div className="space-y-16 py-16 sm:p-16">
      <DataTable.Root table={table} variant="narrow">
        <DataTable.Header>
          <DataTable.Title>Posicion</DataTable.Title>
          <DataTable.Search />
        </DataTable.Header>
        <DataTable.Table>
          <DataTable.Rows>
            <DataTable.Cell accessor="type" label="Tipo" align="center" />
            <DataTable.Cell accessor="title" label="Concepto" align="center" />
            <DataTable.Cell accessor="code" label="Codigo" align="right" />
            <DataTable.Cell accessor="abbreviation" label="Abreviatura" align="center" />
            <DataTable.Cell accessor="quantity" label="Cantidad" align="right" />
            <DataTable.Cell accessor="price" label="Precio" isNumber />
            <DataTable.Cell accessor="date" label="Fecha" isDate />
            <DataTable.Cell accessor="amount" label="Monto" isNumber />
            <DataTable.Cell accessor="amountArs" label="Monto Pesos" isNumber />
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
