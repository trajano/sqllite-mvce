import React, { useEffect, useRef } from "react";

/**
 * This starts an async function and executes another function that performs
 * React state changes if the component is still mounted after the async
 * operation completes
 * @template T
 * @param asyncFunction async function,
 *   it has a copy of the mounted ref so an await chain can be canceled earlier.
 * @param  onSuccess this gets executed after async
 *   function is resolved and the component is still mounted
 * @param deps
 */
export const useAsyncSetEffect = <T>(
  asyncFunction: (mountedRef: React.MutableRefObject<boolean>) => Promise<T>,
  onSuccess: (asyncResult: T) => void,
  deps: React.DependencyList = []
) => {
  const mountedRef = useRef(false);
  if (typeof onSuccess !== "function") {
    throw new Error("onSuccess is not a function");
  }
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const asyncResult = await asyncFunction(mountedRef);
      if (mountedRef.current) {
        onSuccess(asyncResult);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [asyncFunction, onSuccess, ...deps]);
};
