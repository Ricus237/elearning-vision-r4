export type BlogType = {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  featureImage: string;
  shortDescription: string;
  content: unknown[];
  author: {
    name: string;
    photo: string;
    title: string;
  };
  date: string;
};
