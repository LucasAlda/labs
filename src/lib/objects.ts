const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;

const stringToPath = function (string: string | number): (string | number)[] {
  const result = [];
  if (string.toString().charCodeAt(0) === 46 /* . */) {
    result.push("");
  }
  string.toString().replace(rePropName, (match: string, ...args: string[]) => {
    const [number, quote, subString] = args;
    result.push(quote ? subString?.replace(reEscapeChar, "$1") : number ?? match);
    return match;
  });
  return result;
};

function subObject<T extends object>(base: T, pathArray: (string | number)[]): object {
  const path = (pathArray[0] === "index" ? 0 : pathArray[0]) as keyof T;
  if (typeof base[path] === "object" && base[path] !== null) {
    return subObject(base[path] as object, pathArray.slice(1) as [keyof object, ...string[]]);
  }
  return base;
}

export function getObject<T extends object>(base: T, path: string | number): unknown {
  const pathArray = stringToPath(path);
  let lastPath = pathArray.pop() as string;
  lastPath = lastPath === "index" ? "0" : lastPath;

  const sub = subObject(base, pathArray as string[]);

  if (lastPath in sub) {
    return sub[lastPath as never];
  }
}

export function editObject<T extends object>(base: T, path: string | number, value: unknown): T {
  const pathArray = stringToPath(path);
  let lastPath = pathArray.pop() as string;
  lastPath = lastPath === "index" ? "0" : lastPath;

  const sub = subObject(base, pathArray as string[]);

  if (lastPath in sub) {
    sub[lastPath as never] = value as never;
  }

  return base;
}
