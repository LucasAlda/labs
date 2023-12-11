import { faker } from "@faker-js/faker";

const types = ["ACCIONES", "CEDEARS", "MONEDA", "DOLAR CABLE"];
const abbreviations = ["AAPL", "AMZN", "GOOG", "MSFT", "TSLA", "FB", "NFLX", "NVDA", "PYPL", "ZM"];

export function generateData(length: number) {
  return Array.from({ length }, () => {
    const quantity = faker.number.int({ min: 1, max: 1000 });
    const price = faker.number.float({ precision: 2, min: 100, max: 10000 });

    const amount = quantity * price;
    const currency = faker.helpers.weightedArrayElement([
      { value: 1, weight: 0.8 },
      { value: 990, weight: 0.2 },
    ]);

    const amountArs = amount * currency;
    return {
      id: faker.number.int(),
      type: faker.helpers.arrayElement(types),
      title: faker.company.name(),
      code: Number(faker.finance.creditCardCVV()),
      abbreviation: faker.helpers.arrayElement(abbreviations),
      quantity,
      price,
      date: faker.date.past(),
      amount,
      amountArs,
    };
  }).sort((a, b) => {
    const type = types.indexOf(a.type) - types.indexOf(b.type);
    if (type) return type;

    return a.code - b.code;
  });
}
