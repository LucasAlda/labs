import { type AppType } from "next/dist/shared/lib/utils";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main
      className={cn("flex min-h-screen flex-col overflow-visible", {
        "sm:grid sm:grid-cols-[auto_1fr]": true,
      })}
    >
      <Sidebar />
      <div className="flex grow flex-col overflow-x-auto">
        <Component {...pageProps} />
      </div>
    </main>
  );
};

export default MyApp;
