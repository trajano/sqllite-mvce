import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { DataProvider } from "./data-context/DataContext";
import { DataComponent } from "./DataComponent";

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider databaseName="foo">
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <View style={[{ paddingTop: insets!.top }, styles.container]}>
              <Text>Open up App.tsx to statrt working on your app!</Text>
              <DataComponent />
              <StatusBar style="auto" />
            </View>
          )}
        </SafeAreaInsetsContext.Consumer>
      </DataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
