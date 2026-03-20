"use client";
import { useState } from "react";
import Button from "../ui/button";
import { CloseIcon, SearchIcon } from "@/lib/icons";
import Input from "../ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";

interface HeaderExtraInfoProps {
  user?: { username: string } | null;
}

const HeaderExtraInfo = ({ user }: HeaderExtraInfoProps) => {
  const [searchBarShow, setSearchBarShow] = useState(false);

  return (
    <div className="flex items-center gap-x-4">
      <div>
        {/* search input field */}
        <div
          className={cn(
            "relative z-50 h-12 w-full max-lg:absolute max-lg:top-0 max-lg:left-0 max-lg:z-999 lg:max-w-60",
            searchBarShow ? "max-lg:block" : "max-lg:hidden",
          )}
        >
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <button
            onClick={() => setSearchBarShow(false)}
            className="absolute top-1/2 right-3 z-30 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-gray-600 lg:hidden"
          >
            <CloseIcon />
          </button>
          <Input
            placeholder="Search course here..."
            className="h-full bg-gray-50 pr-7 pl-11 max-lg:rounded-none shadow-none"
          />
        </div>
        {searchBarShow && (
          <div className="absolute top-0 left-0 z-30 h-full min-h-screen w-full bg-gray-50"></div>
        )}
        {/* the search icon show less than larger devices */}
        <button
          onClick={() => setSearchBarShow(true)}
          className="flex h-4 w-4 items-center justify-center lg:hidden"
        >
          <SearchIcon />
        </button>
        {/* login and sign up button the button*/}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline-block text-sm font-medium text-secondary truncate max-w-[100px] lg:max-w-none">
              {user.username}
            </span>
            <Button
              onClick={() => logoutAction()}
              variant="outline"
              className="h-10 lg:h-12 py-1 px-4 lg:px-6 text-sm lg:text-base border-purple-200 hover:bg-purple-50 text-purple-600"
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            asChild
            className="h-10 lg:h-12 justify-between gap-2.5 py-1 px-4 lg:pl-6 lg:pr-1.5 text-sm lg:text-base tracking-base flex"
          >
            <Link href={"/login"}>
              <span className="hidden lg:inline">Login/ Sign up</span>
              <span className="lg:hidden">Login</span>
              <span className="hidden lg:flex size-9 items-center justify-center rounded-full bg-primary text-purple-500">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.8333 14.1667L15 10M15 10L10.8333 5.83333M15 10L3.33333 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default HeaderExtraInfo;
