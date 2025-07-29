declare module '@microlink/react' {
  import React from 'react';

  export interface MicrolinkProps {
    url: string;
    size?: 'small' | 'normal' | 'large';
    media?: Array<'image' | 'video' | 'audio' | 'iframe' | 'logo'>;
    video?: boolean;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    contrast?: boolean | string;
    loading?: 'lazy' | 'eager' | 'auto';
    fetchData?: boolean;
    setData?: (data: any) => any;
    style?: React.CSSProperties;
    className?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    apiKey?: string;
    [key: string]: any; // For additional API parameters
  }

  const Microlink: React.FC<MicrolinkProps>;
  export default Microlink;
}