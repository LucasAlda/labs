import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Menu as MenuIcon } from "lucide-react";
import { Menu } from "@/components/ui/menu";

export const Sidebar = () => {
  const [show, setShow] = useState(false);

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          height: show ? "100svh" : "4rem",
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={cn(
          "sidebar group/sidebar transition-all duration-300 ease-in-out print:hidden",
          "w-full overflow-hidden bg-slate-800 sm:h-[100svh] sm:w-[200px] lg:w-[210px]",
          "pinned",
          "fixed left-0 top-0 z-10 flex grow sm:sticky",
          { "h-[100svh]": show, "sm:!h-[100svh]": !show }
        )}
      >
        <div className="flex h-screen grow flex-col gap-6 overflow-auto sm:overflow-visible">
          <motion.div
            initial={false}
            animate={{
              paddingBottom: !show ? "1rem" : 0,
            }}
            transition={{
              delay: !show ? 0.4 : 0,
              duration: 0.01,
            }}
            className={cn("flex items-center justify-between pt-5", {
              "sm:!pb-1": !show,
            })}
          >
            <h1 className={cn("px-5 text-lg font-semibold text-slate-100 sm:text-xl")}>Labs</h1>
            <button className="mb-1 mr-5 block text-slate-100 sm:hidden" onClick={() => setShow((prev) => !prev)}>
              <MenuIcon />
            </button>
          </motion.div>
          <div className="grow sm:overflow-auto">
            <MainMenu setShow={setShow} />
          </div>
        </div>
      </motion.div>
      <div className="h-16 sm:hidden"></div>
    </>
  );
};

const MainMenu = ({ setShow }: { setShow: (show: boolean) => void }) => {
  return (
    <Menu onNavigate={() => setShow(false)}>
      <Menu.Dropdown path="/datatable" label="DataTable">
        <Menu.Option path="/start">Start</Menu.Option>
        <Menu.Option path="/no-container">No container</Menu.Option>
        <Menu.Option path="/extras">Extras</Menu.Option>
        <Menu.Option path="/variants">Variants</Menu.Option>
        <Menu.Option path="/subheaders">Subheaders</Menu.Option>
        <Menu.Option path="/view">View</Menu.Option>
        <Menu.Option path="/action">Actions</Menu.Option>
        <Menu.Option path="/complete">Complete</Menu.Option>
        <Menu.Option path="/ssr">SRR</Menu.Option>
      </Menu.Dropdown>
      <Menu.Dropdown path="/formlike" label="Formlike">
        <Menu.Option path="/no-context">Sin Context</Menu.Option>
        <Menu.Option path="/apertura">Apertura</Menu.Option>
      </Menu.Dropdown>
    </Menu>
  );
};
