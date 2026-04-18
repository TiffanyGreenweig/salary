import { createContext, useContext, type PropsWithChildren } from 'react';

import type { RootStore } from './RootStore';

const RootStoreContext = createContext<RootStore | null>(null);

export function RootStoreProvider({ store, children }: PropsWithChildren<{ store: RootStore }>) {
  return <RootStoreContext.Provider value={store}>{children}</RootStoreContext.Provider>;
}

export function useRootStore(): RootStore {
  const store = useContext(RootStoreContext);

  if (!store) {
    throw new Error('Root store is not available');
  }

  return store;
}
