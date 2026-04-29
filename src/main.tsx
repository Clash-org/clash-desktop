import './polyfills';
import ReactDOM from "react-dom/client";
import "./global.css";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import { Provider } from "jotai";
import { AuthProvider } from './providers/AuthProvider';
import { ApiProvider } from './providers/ApiProvider';
import { ContractProvider } from './providers/ContractProvider';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
  <ApiProvider>
    <AuthProvider>
        <Provider>
          <ContractProvider>
            <Layout />
          </ContractProvider>
        </Provider>
        <Toaster toastOptions={{
          style: {
            wordBreak: "break-word",
            overflowWrap: "break-word"
          }
        }}
        />
    </AuthProvider>
  </ApiProvider>
  </>,
);
