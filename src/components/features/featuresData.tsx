import {
  CertificateCheckFill,
  ClockFill,
  GraduationHatFill,
} from "@/lib/icons";
import { ReactElement } from "react";

type featureType = {
  id: number;
  icon: ReactElement;
  title: string;
  description: string;
  thumbnail: string;
};
export const featuresData: featureType[] = [
  {
    id: 1,
    icon: <GraduationHatFill />,
    title: "Comprehensive Biblical Education",
    description:
      "Learn from our carefully structured 7-course program covering theology, Scripture, Christian living, and church history.",
    thumbnail: "/images/features/img-1.png",
  },
  {
    id: 2,
    icon: <ClockFill />,
    title: "Learn at Your Own Pace",
    description:
      "Access 70 lessons per course with flexible scheduling. Study foundational topics or advanced theology whenever suits you best.",
    thumbnail: "/images/features/img-2.png",
  },
  {
    id: 3,
    icon: <CertificateCheckFill />,
    title: "Verified Completion Certificates",
    description:
      "Earn certificates after completing comprehensive exams, validating your Christian education and spiritual growth.",
    thumbnail: "/images/features/img-3.png",
  },
];
