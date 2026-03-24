'use client';
import { useState, useMemo } from "react";
import CourseCard from "@/components/courses/courseCard";
import Input from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "@/lib/icons";
import { CourseType } from "@/types/CourseType";
import { CategoryType } from "@/types/CategoryType";

const priceFilter = [
  { label: "All Prices", value: "all" },
  { label: "Free", value: "free" },
  { label: "Under $50", value: "0-50" },
  { label: "$50-$100", value: "50-100" },
  { label: "$100-$200", value: "100-200" },
  { label: "Over $200", value: "200-plus" },
];

const sortingOptions = [
  { label: "Default Sorting", value: "all" },
  { label: "Price: Low to High", value: "price-low-to-high" },
  { label: "Price: High to Low", value: "price-high-to-low" },
  { label: "Title: A-Z", value: "title-az" },
];

interface CoursesDsiplayProps {
  courses: CourseType[];
  categories: CategoryType[];
  isLoggedIn?: boolean;
}

const CoursesDsiplay = ({ courses, categories, isLoggedIn }: CoursesDsiplayProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedSort, setSelectedSort] = useState("all");

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchTerm) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(c => c.categoryId?.toString() === selectedCategory);
    }

    // Price filter
    if (selectedPrice !== "all") {
      result = result.filter(c => {
        const p = c.discountPrice || c.price;
        if (selectedPrice === "free") return p === 0;
        if (selectedPrice === "0-50") return p > 0 && p <= 50;
        if (selectedPrice === "50-100") return p > 50 && p <= 100;
        if (selectedPrice === "100-200") return p > 100 && p <= 200;
        if (selectedPrice === "200-plus") return p > 200;
        return true;
      });
    }

    // Sorting
    if (selectedSort !== "all") {
      result.sort((a, b) => {
        const pA = a.discountPrice || a.price;
        const pB = b.discountPrice || b.price;
        if (selectedSort === "price-low-to-high") return pA - pB;
        if (selectedSort === "price-high-to-low") return pB - pA;
        if (selectedSort === "title-az") return a.title.localeCompare(b.title);
        return 0;
      });
    }

    return result;
  }, [courses, searchTerm, selectedCategory, selectedPrice, selectedSort]);

  return (
    <div className="bg-gray-50 pt-11 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-28">
      <div className="container">
        {/* search and sorting  */}
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4">
          <div className="relative h-11 w-full sm:h-12 sm:max-w-85">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <Input
              placeholder="Search course here..."
              className="h-full bg-primary pr-7 pl-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="min-w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item._id} value={item.slug.current}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPrice} onValueChange={setSelectedPrice}>
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {priceFilter.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="min-w-40">
                <SelectValue placeholder="Sorting" />
              </SelectTrigger>
              <SelectContent>
                {sortingOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* count info */}
        <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-secondary font-medium">
                Showing <span className="text-gray-900 font-bold">{filteredCourses.length}</span> of <span className="text-gray-900 font-bold">{courses.length}</span> courses
            </p>
        </div>

        {/* courses list */}
        {filteredCourses.length > 0 ? (
            <div className="grid gap-6 pt-8 pb-11 sm:grid-cols-2 sm:pb-14 lg:grid-cols-3 lg:pb-16">
                {filteredCourses.map((course) => (
                    <CourseCard key={course._id} course={course} isLoggedIn={isLoggedIn} />
                ))}
            </div>
        ) : (
            <div className="py-20 text-center">
                <div className="size-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                    <SearchIcon className="size-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-secondary max-w-xs mx-auto text-sm">We couldn't find any courses matching your current filters. Try adjusting your search or filters.</p>
                <button 
                    onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setSelectedPrice("all"); setSelectedSort("all"); }}
                    className="mt-6 text-purple-600 font-bold hover:underline"
                >
                    Clear all filters
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CoursesDsiplay;
