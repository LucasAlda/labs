type ProxyCallback = (_path: string[], _args: unknown[]) => unknown;

export function createFlatProxy<TFaux>(callback: (_path: keyof TFaux & string) => unknown): TFaux {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return new Proxy(() => {}, {
    get(_obj, name) {
      if (typeof name !== "string") return undefined;
      return callback(name as keyof TFaux & string);
    },
  }) as TFaux;
}

function createInnerProxy(callback: ProxyCallback, path: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const proxy: unknown = new Proxy(() => {}, {
    get(_target, key) {
      if (typeof key !== "string") return undefined;
      return createInnerProxy(callback, [...path, key]);
    },
    apply(_target, _thisArg, args) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return callback(path, args);
    },
  });

  return proxy;
}

export function createRecursiveProxy(callback: ProxyCallback) {
  return createInnerProxy(callback, []);
}
