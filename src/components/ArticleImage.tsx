import { useState } from "react";
import ArticlePlaceholder from "./ArticlePlaceholder";

interface ArticleImageProps {
  src: string;
  className?: string;
}

/**
 * Article thumbnail image with automatic fallback to placeholder
 * when the image fails to load (e.g., hotlink protection, 404, etc.)
 */
export default function ArticleImage({ src, className = "" }: ArticleImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <ArticlePlaceholder />;
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
