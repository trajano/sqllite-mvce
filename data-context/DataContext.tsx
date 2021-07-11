import React, {
  createContext,
  PropsWithChildren,
  useContext, useEffect, useRef
} from "react";
import { DataStore } from "./DataStore";
import { usePollWhileOnline } from "../hooks/usePollWhiteOnline";

const DataContext = createContext<{ db?: DataStore }>({});

type P = { databaseName: string };
export function DataProvider({ children, databaseName }: PropsWithChildren<P>) {
  const dbRef = useRef<DataStore>(new DataStore());
  useEffect(() => {
    (async () => {
      console.log("setup");
      await dbRef.current.setup(databaseName);
      console.log("setup done");
    })();
  }, []);

  usePollWhileOnline(async() => {
    console.log("add");
    await dbRef.current.add(Date.now());
    console.log("add done");
  }, 10000)
  return (
    <DataContext.Provider value={{ db: dbRef.current }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
