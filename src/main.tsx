import 'antd-mobile/es/global';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.less';
import { RootStore } from './store/RootStore';
import { RootStoreProvider } from './store/rootStoreContext';

const rootStore = new RootStore();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootStoreProvider store={rootStore}>
    <App />
  </RootStoreProvider>,
);
