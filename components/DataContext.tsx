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

  useAsyncSetEffect(
    async () => {
      dbRef.current.setup(databaseName);
      return await dbRef.current.query();
    },
    (q) => {
      dataRef.current = q;
    },
    []
  );
  usePollWhileOnline(async () => {
    await dbRef.current.add(Date.now());
  }, 10000);
  return (
    <DataContext.Provider value={{ data: dataRef.current, db: dbRef.current }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
