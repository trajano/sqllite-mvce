import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useRef } from "react";
import Constants, { AppOwnership } from "expo-constants";
import { Platform } from "react-native";

/**
 * This will continously run a function with a delay per call (regardless of
 * error until cancelled).  This does not invoke the function if there's no
 * connectivity to the Internet (if BASE_URL only connectivity is checked
 * rather than full Internet).
 * @param asyncFunction
 * @param interval milliseconds  between calls to the asyncFunction, defaults to a minute
 * @param immediate if true it will run the asyncFunction immediately before looping
 * @returns
 */
export function usePollWhileOnlineWithSetEffect<T>(
  asyncFunction: () => PromiseLike<T>,
  onSuccess: (result: T) => void,
  interval: number = 60000,
  immediate = true
): { activeRef: React.MutableRefObject<boolean> } {
  const timeoutRef = useRef<number>();
  const mountedRef = useRef(false);
  const activeRef = useRef(immediate);

  const wrappedAsyncFunction = async () => {
    activeRef.current = true;
    const netInfo = await NetInfo.fetch();
    const connected =
      (Platform.OS === "ios" && Constants.appOwnership === AppOwnership.Expo) ||
      (netInfo.isConnected && (netInfo.isInternetReachable ?? true));

    if (connected) {
      try {
        const result = await asyncFunction();
        if (mountedRef.current) {
          onSuccess(result);
        }
      } catch (e) {
        console.error("Error while polling", e);
      }
    } else {
      console.warn(
        "Connectivity check failed",
        netInfo.isConnected,
        netInfo.isInternetReachable
      );
    }
    if (mountedRef.current) {
      timeoutRef.current = setTimeout(
        wrappedAsyncFunction,
        interval
      ) as unknown as number;
    }
    activeRef.current = false;
  };

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      wrappedAsyncFunction();
    } else {
      timeoutRef.current = setTimeout(
        wrappedAsyncFunction,
        interval
      ) as unknown as number;
    }
    return () => {
      clearTimeout(timeoutRef.current);
      mountedRef.current = false;
    };
  }, [asyncFunction, onSuccess]);

  return { activeRef };
}
