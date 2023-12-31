const DATA = generateData(15);

import { useTable } from "@/components/datatable/hooks";
import { generateData } from "@/faker";

import { useEffect, useState } from "react";

// MOSTRAR:
// = API
// = SORTING
// = HIDE
export default function Example() {
  const [data, setData] = useState<typeof DATA>();

  useEffect(() => {
    setTimeout(() => {
      setData(DATA);
    }, 2000);
  }, []);

  const [table, DataTable] = useTable({
    data,
  });

  return (
    <div className="space-y-16 py-16 sm:p-16">
      <DataTable.Root table={table} variant="narrow">
        <DataTable.Header>
          <DataTable.Title>Posicion</DataTable.Title>
        </DataTable.Header>
        <DataTable.Table>
          <DataTable.Rows>
            <DataTable.Column accessor="type" label="Tipo" align="center" />
            <DataTable.Column accessor="title" label="Concepto" align="center" />
            <DataTable.Column accessor="code" label="Codigo" align="right" />
            <DataTable.Column accessor="abbreviation" label="Abreviatura" align="center" />
            <DataTable.Column accessor="quantity" label="Cantidad" align="right" />
            <DataTable.Column accessor="price" label="Precio" isNumber />
            <DataTable.Column accessor="date" label="Fecha" isDate />
            <DataTable.Column accessor="amount" label="Monto" isNumber />
            <DataTable.Column accessor="amountArs" label="Monto Pesos" isNumber />
          </DataTable.Rows>
        </DataTable.Table>
      </DataTable.Root>
    </div>
  );
}
