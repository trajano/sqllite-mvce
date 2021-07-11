import React from "react";
import { useState } from "react";
import { Button, FlatList, Text } from "react-native";
import { useData } from "./data-context/DataContext";
import { StorageType } from "./data-context/DataStore";
import { usePollWhileOnlineWithSetEffect } from "./hooks/usePollWhileOnlineWithSetEffect";
export function DataComponent() {
  const { db } = useData();
  const [data, setData] = useState<StorageType[]>([]);
  usePollWhileOnlineWithSetEffect(
    async () => db?.query(),
    (result) => {
      console.log("result", result)
      if (result) {
        setData(result);
      } else {
        setData([]);
      }
    },
    10000,
    true
  );
  return (
    <>
      <FlatList
        style={{
          borderWidth: 1,
        }}
        data={data}
        renderItem={({item}) => {
          return <Text>ABC{item.encryptedArtifactId}</Text>;
        }}
        keyExtractor={(item)=>item.id.toString()}
      ></FlatList>
      <Button onPress={() => {}} title="foo" />
    </>
  );
}
