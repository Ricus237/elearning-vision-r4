
import Link from "next/link";
import Navigation from "./navigation";
import MobileNavigation from "./mobileNavigation";

export type MenuType = {
  id: number;
  label: string;
  href: string;
  subMenu?: {
    id: number;
    label: string;
    href: string;
  }[];
};
const menuList: MenuType[] = [
  {
    id: 1,
    label: "Home",
    href: "/",
  },
  {
    id: 2,
    label: "About",
    href: "/about",
  },
  {
    id: 3,
    label: "Programs",
    href: "/programs",
  },
  {
    id: 4,
    label: "Apply",
    href: "/apply",
  },
  {
    id: 6,
    label: "Login",
    href: "/dashboard",
  },
];

const Header = () => {

  return (
    <header className="sticky top-0 left-0 z-50 w-full overflow-x-clip bg-primary py-4">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href={"/"} className="inline-block shrink-0 py-1.75 text-2xl font-bold tracking-tight text-white lg:text-3xl font-serif">
              Global Bible Institute
            </Link>
            <Navigation data={menuList} />
          </div>
          <div className="flex items-center gap-6">
            <Link href="/apply" className="px-6 py-2.5 bg-white text-purple-700 font-bold rounded-full hover:bg-slate-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-sm">
               Apply Now
            </Link>
            <MobileNavigation data={menuList}  />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
