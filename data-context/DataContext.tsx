import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useRef,
  useState,
} from "react";
import { Text, View } from "react-native";
import { useAsyncSetEffect } from "../hooks/useAsyncSetEffect";
import { usePollWhileOnline } from "../hooks/usePollWhiteOnline";
import { DataStore } from "./DataStore";

const DataContext = createContext<{ db?: DataStore }>({});

type P = { databaseName: string };
export function DataProvider({ children, databaseName }: PropsWithChildren<P>) {
  const dbRef = useRef<DataStore>(new DataStore());
  const [initialized, setInitialized] = useState(false);

  console.log("about to useAsyncSetEffect");
  useAsyncSetEffect(
    async () => {
      if (!initialized) {
      console.log("about to setup database");
      await dbRef.current.setup(databaseName);
      console.log("done setup database");
      }
    },
    () => {
      setInitialized(true);
    },
    []
  );
  console.log("about to usePollWhileOnline");
  usePollWhileOnline(async () => {
    if (initialized) {
      console.log("> add");
      await dbRef.current.add(Date.now());
      console.log("< add");
    }
  }, 10000);
  if (initialized) {
    return (
      <DataContext.Provider value={{ db: dbRef.current }}>
        {children}
      </DataContext.Provider>
    );
  } else {
    return (
      <View>
        <Text>Loading database</Text>
      </View>
    );
  }
}

export function useData() {
  return useContext(DataContext);
}
