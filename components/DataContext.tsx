import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useRef,
  useState,
} from "react";
import { useAsyncSetEffect } from "../hooks/useAsyncSetEffect";
import { usePollWhileOnline } from "../hooks/usePollWhiteOnline";
import { DataStore } from "./DataStore";

const DataContext = createContext<{ db?: DataStore; data: any[] }>({
  data: [],
});

type P = { databaseName: string };
export function DataProvider({ children, databaseName }: PropsWithChildren<P>) {
  const dbRef = useRef<DataStore>(new DataStore());
  const dataRef = useRef<any[]>([]);
  const activeRef = useRef(true);
  useAsyncSetEffect(
    async () => {
      await dbRef.current.setup(databaseName);
      return await dbRef.current.query();
    },
    (q) => {
      dataRef.current = q;
    },
    []
  );
  usePollWhileOnline(async () => {
    if (activeRef.current) {
      return;
    }
    activeRef.current = true;
    await dbRef.current.add(Date.now());
    activeRef.current = false;
  }, 10000, false);
  return (
    <DataContext.Provider value={{ data: dataRef.current, db: dbRef.current }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
