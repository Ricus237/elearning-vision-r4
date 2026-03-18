type testimonialType = {
  id: number;
  user: {
    name: string;
    position: string;
    image: string;
  };
  review?: string;
  videoThumb?: string;
  videoUrl?: string;
  isVideoReview: boolean;
};

export const testimonialData: testimonialType[] = [
  {
    id: 1,
    user: {
      name: "Marie Dubois",
      position: "Student, Paris",
      image: "/images/testimonial/user-1.png",
    },
    isVideoReview: false,
    review:
      "This Christian education platform has transformed my understanding of Scripture. The courses are thorough, well-organized, and have deepened my faith tremendously. I especially appreciated the 'Foundations of Christian Faith' course.",
  },
  {
    id: 2,
    user: {
      name: "Jean Claude Martin",
      position: "Believer, Lyon",
      image: "/images/testimonial/user-2.png",
    },
    isVideoReview: true,
    videoUrl: "https://www.youtube.com/watch?v=ssVGeSf8oFI",
    videoThumb: "/images/testimonial/video-thumb-1.png",
  },
  {
    id: 3,
    user: {
      name: "Sophie Laurent",
      position: "Bible Study Leader, Marseille",
      image: "/images/testimonial/user-3.png",
    },
    isVideoReview: false,
    review:
      "As a church leader, I found the 'Christian Theology & Doctrine' course invaluable. It provided depth and clarity that I now share with my study group. Highly recommend for anyone serious about theology.",
  },
  {
    id: 4,
    user: {
      name: "Pierre Rousseau",
      position: "New Christian, Toulouse",
      image: "/images/testimonial/user-4.png",
    },
    isVideoReview: true,
    videoUrl: "https://www.youtube.com/watch?v=ssVGeSf8oFI",
    videoThumb: "/images/testimonial/video-thumb-2.png",
  },
  {
    id: 5,
    user: {
      name: "Elisabeth Blanc",
      position: "Theology Student, Nice",
      image: "/images/testimonial/user-5.png",
    },
    isVideoReview: false,
    review:
      "The comprehensive curriculum and flexible pace made it possible for me to balance my studies with ministry work. I've completed three courses and earned certificates. The exams are fair and challenging.",
  },
];
