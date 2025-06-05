import { ReactNode } from "react";
import Image from "next/image";

type Props = {};

export const PlaceholderImage: React.FC<Props> = () => {
  return (
    <Image
      src="/analytics_placeholder.svg"
      alt="no data"
      width={750}
      height={500}
    />
  );
};
