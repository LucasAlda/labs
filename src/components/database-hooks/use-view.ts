import { useLocalStorage } from "@/components/database-hooks/use-localstorage";
import { type Updater } from "@tanstack/react-form";
import { type SortingState, type VisibilityState } from "@tanstack/react-table";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* eslint-disable @typescript-eslint/ban-types */
export type ViewSizes = "sm" | "md" | "lg";

type Visibilitys<T extends string | symbol | number = string> = {
  [k in ViewSizes]?: { [k in T | (string & {})]?: boolean };
};

type Orders = {
  [k in ViewSizes]?: string[];
};

export function useView<T extends string | symbol | number = string>(
  key: string | undefined,
  defaultVisibility?: Visibilitys<T>
) {
  const [_defaultVisibility] = useState(defaultVisibility);
  const [size, setSize] = useState<ViewSizes>("lg");
  const [orders, setOrders, orderChanged] = useLocalStorage<Orders>(`table_${key ?? ""}_order`, {});
  const [visibilitys, setVisibilitys, visibilityChanged] = useLocalStorage<Visibilitys>(
    `table_${key ?? ""}_columns`,
    _defaultVisibility ?? {}
  );
  const [sort, setSort, sortChanged] = useLocalStorage<SortingState>(`table_${key ?? ""}_sort`, []);

  useIsomorphicLayoutEffect(() => {
    function onResize() {
      if (window.innerWidth < 640) {
        setSize("sm");
      } else if (window.innerWidth < 1024) {
        setSize("md");
      } else {
        setSize("lg");
      }
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibility = visibilitys[size] as VisibilityState;
  const order = orders[size];

  const save = useCallback(() => {
    setVisibilitys((v) => v, true);
    setOrders((o) => o, true);
    setSort((s) => s, true);
  }, [setVisibilitys, setOrders, setSort]);

  const changeOrder = useCallback(
    (order: Updater<string[]>, onSize = size) => {
      setOrders((prev) => {
        const newOrder = typeof order === "function" ? order(prev[onSize] ?? []) : order;
        return { ...prev, [onSize]: newOrder };
      }, false);
    },
    [setOrders, size]
  );

  const changeVisibility = useCallback(
    (visibility: Updater<VisibilityState>, onSize = size) => {
      setVisibilitys((prev) => {
        const newVisibility =
          typeof visibility === "function" ? visibility((prev[onSize] as VisibilityState) ?? {}) : visibility;
        return { ...prev, [onSize]: newVisibility };
      }, false);
    },
    [setVisibilitys, size]
  );

  const toggleVisibility = useCallback(
    (col: string, value: boolean, size: ViewSizes) => {
      changeVisibility((p) => {
        p = p ?? {};
        p[col] = value;
        return p;
      }, size);
    },
    [changeVisibility]
  );

  const getIsVisible = useCallback(
    (col: string, size: ViewSizes) => {
      return visibilitys[size]?.[col] ?? true;
    },
    [visibilitys]
  );

  const changeSort = useCallback(
    (sort: Updater<SortingState>) => {
      setSort((prev) => {
        const newSort = typeof sort === "function" ? sort(prev) : sort;
        return newSort;
      }, false);
    },
    [setSort]
  );

  const reset = useCallback(
    (onSize = size) => {
      changeVisibility(() => _defaultVisibility?.[onSize ?? size] as VisibilityState, onSize ?? size);
      changeOrder(() => [], onSize ?? size);
      setSort(() => [], false);
    },
    [size, changeVisibility, changeOrder, setSort, _defaultVisibility]
  );

  const a = useMemo(
    () => ({
      order,
      orders,
      getIsVisible,
      visibility,
      size,
      changeOrder,
      changeVisibility,
      reset,
      toggleVisibility,
      sort,
      changeSort,
      isChanged: key && (orderChanged || visibilityChanged || sortChanged),
      save,
    }),
    [
      changeOrder,
      changeVisibility,
      getIsVisible,
      key,
      order,
      orderChanged,
      orders,
      reset,
      save,
      changeSort,
      size,
      sort,
      sortChanged,
      toggleVisibility,
      visibility,
      visibilityChanged,
    ]
  );

  return a;
}
