import Button from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { WheatLeavesLeft, WheatLeavesRight } from "@/lib/icons";
import ButtonArrow from "../ui/buttonArrow";

interface HeroProps {
  title?: string;
  description?: string;
}

const Hero = ({ title, description }: HeroProps) => {
  return (
    <section
      className="overflow-x-hidden bg-cover bg-center bg-no-repeat pt-11 pb-[87px] sm:pt-16 lg:pt-20"
      style={{ backgroundImage: `url('/images/hero/bg-img.png')` }}
    >
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-[clamp(2.25rem,1.663rem+2.6087vw,3.75rem)] leading-[1.2] font-bold tracking-[-1.2px] font-serif">
            {title || "International Bible Institute"}
          </h1>
          <p className="mx-auto mt-4 max-w-[800px] text-center leading-[1.5] text-secondary sm:text-lg lg:text-xl">
            {description || "A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God!"}
          </p>
          <div className="mt-12 flex flex-col gap-4 max-sm:w-full sm:flex-row items-center justify-center">
            <Button
              asChild
              size="lg"
              className="py-1.5 pr-1.5 pl-6 max-sm:w-full"
            >
              <Link href={"/apply"}>
                <span className="w-full">Enroll Now and Begin Your Journey in the Word of God</span>
                <ButtonArrow />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full bg-primary sm:w-auto px-8"
            >
              <Link href={"/programs"}>
                <span>Curriculum Overview</span>
              </Link>
            </Button>
          </div>
          {/* image gallery */}
          <div className="pt-20 sm:pt-[154px]">
            <div className="mx-auto grid max-w-[1048px] grid-cols-2 lg:grid-cols-4">
              <div className="relative z-[1] h-[272px] w-[261px] rotate-[7deg] rounded-[14.7px] bg-primary p-1.5 shadow-2xl">
                <Image
                  width={261}
                  height={272}
                  sizes="100vw"
                  src={"/images/hero/img-1.png"}
                  alt="img"
                />
              </div>
              <div className="h-[272px] w-[261px] -rotate-[15deg] rounded-[14.7px] bg-primary p-1.5 shadow-2xl">
                <Image
                  width={261}
                  height={272}
                  sizes="100vw"
                  src={"/images/hero/img-2.png"}
                  alt="img"
                  className="rounded-[14.7px]"
                />
              </div>
              <div className="hidden h-[272px] w-[261px] rotate-[7deg] rounded-[14.7px] bg-primary p-1.5 shadow-2xl sm:block">
                <Image
                  width={261}
                  height={272}
                  sizes="100vw"
                  src={"/images/hero/img-3.png"}
                  alt="img"
                  className="rounded-[14.7px]"
                />
              </div>
              <div className="hidden h-[272px] w-[261px] -rotate-[7.85deg] rounded-[14.7px] bg-primary p-1.5 shadow-2xl sm:block">
                <Image
                  width={261}
                  height={272}
                  sizes="100vw"
                  src={"/images/hero/img-4.png"}
                  alt="img"
                  className="rounded-[14.7px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

