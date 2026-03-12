import './polyfills';
import ReactDOM from "react-dom/client";
import "./global.css";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import { Provider } from "jotai";
import { AuthProvider } from './providers/AuthProvider';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
  <AuthProvider>
    <Provider>
      <Layout />
    </Provider>
    <Toaster toastOptions={{
      style: {
        wordBreak: "break-word",
        overflowWrap: "break-word"
      }
    }}
    />
  </AuthProvider>
  </>,
);
