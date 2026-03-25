import { Logo } from "@/lib/icons";
import Link from "next/link";
import Navigation from "./navigation";
import MobileNavigation from "./mobileNavigation";
import HeaderExtraInfo from "./headerExtraInfo";

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
    id: 5,
    label: "Exams",
    href: "/exams",
  },
];

import { cookies } from "next/headers";

const Header = async () => {
  const cookieStore = await cookies();
  const username = cookieStore.get("moodle_user")?.value;
  const user = username ? { username } : null;

  return (
    <header className="sticky top-0 left-0 z-50 w-full overflow-x-clip bg-primary py-4">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href={"/"} className="inline-block shrink-0 py-1.75 text-2xl font-bold tracking-tight text-white lg:text-3xl font-serif">
              International Bible Institute
            </Link>
            <Navigation data={menuList} />
          </div>
          <div className="flex items-center gap-7">
            {/* <HeaderExtraInfo user={user} /> */}
            <MobileNavigation data={menuList}  />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
