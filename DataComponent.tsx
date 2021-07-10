import React from "react";
import { Button, FlatList, Text } from "react-native";
import { useData } from "./data-context/DataContext";
export function DataComponent() {
  const { data } = useData();
  console.log("data", data)
  return (
    <>
      <FlatList
        style={{
          borderWidth: 1,
        }}
        data={data}
        renderItem={(item) => {
          console.log(item);
          return <Text>ABC{JSON.stringify(item)}</Text>;
        }}
      ></FlatList>
      <Button onPress={() => {}} title="foo" />
    </>
  );
}
