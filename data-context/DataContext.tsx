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

const DataContext = createContext<{ db: DataStore }>({
  db: new DataStore()
});

type P = { databaseName: string };
export function DataProvider({ children, databaseName }: PropsWithChildren<P>) {
  const dbRef = useRef<DataStore>();
  const activeRef = useRef(true);
  useAsyncSetEffect(
    async () => {
      console.log("setup")
      await dbRef.current.setup(databaseName);
    },
    (q) => {
      console.log(q)
      activeRef.current = false;
    },
    []
  );
  usePollWhileOnline(async () => {
    console.log("poll", activeRef.current)
    if (activeRef.current) {
      return;
    }
    activeRef.current = true;
    await dbRef.current.add(Date.now());
    activeRef.current = false;
  }, 10000, false);
  return (
    <DataContext.Provider value={{  db: dbRef.current }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
