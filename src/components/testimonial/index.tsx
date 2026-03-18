import SectionTitle from "../sectionTitle";
import TestimonialSlider from "./testimonialSlider";
import { ChevronLeft, ChevronRight } from "@/lib/icons";

const Testimonial = () => {
  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-5">
        <SectionTitle
          subTitle="Testimonial"
          description="Hear from students whose faith and biblical knowledge have been strengthened through our comprehensive Christian education program."
        >
          Student Success Stories
        </SectionTitle>
          <div className="flex items-center gap-x-2 sm:gap-x-4">
            <button className="testimonial-prev-arrow flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-primary transition-all duration-500 hover:bg-purple-500 hover:text-primary">
              <ChevronRight />
            </button>
            <button className="testimonial-next-arrow flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-primary transition-all duration-500 hover:bg-purple-500 hover:text-primary">
              <ChevronLeft />
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="container pt-11 sm:pt-14 lg:pt-16">
          <TestimonialSlider />
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
