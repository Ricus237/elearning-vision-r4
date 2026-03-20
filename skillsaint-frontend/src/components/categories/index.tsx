import { CategoryType } from "@/types/CategoryType";
import SectionTitle from "../sectionTitle";

import CategoryCard from "./categoryCard";
import { getMoodleCategories } from "@/lib/moodle";

const Categories = async () => {
  const categories: CategoryType[] = await getMoodleCategories();

  // Si aucune catégorie n'est trouvée, on peut afficher un message ou rien
  if (categories.length === 0) return null;

  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-28">
      <div className="container">
        <SectionTitle subTitle="Categories">Top Learning Categories</SectionTitle>
        <div className="grid gap-4 pt-11 sm:grid-cols-2 sm:pt-14 lg:grid-cols-3 lg:pt-16">
          {categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
