'use client';
import Image, { ImageProps } from 'next/image';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&w=1200&q=60';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string | null;
  alt: string;
};

export default function SafeImage({ src, alt, ...rest }: Props) {
  const safeSrc =
    typeof src === 'string' && src.trim() ? src : FALLBACK_IMG;

  return <Image src={safeSrc} alt={alt} {...rest} />;
}
