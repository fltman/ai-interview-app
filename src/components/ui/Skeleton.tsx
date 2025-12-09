import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'pulse',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'skeleton-wave';
      case 'pulse':
        return 'animate-pulse';
      case 'none':
      default:
        return '';
    }
  };

  const defaultHeight = variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px';
  const defaultWidth = variant === 'circular' ? '40px' : '100%';

  const style: React.CSSProperties = {
    width: width || defaultWidth,
    height: height || defaultHeight,
  };

  return (
    <div
      className={`bg-gray-200 ${getVariantClasses()} ${getAnimationClasses()} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '70%' : '100%'}
          height="1em"
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="1.25em" />
          <Skeleton variant="text" width="40%" height="1em" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
};

export interface SkeletonListProps {
  items?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ items = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="80%" height="1em" />
            <Skeleton variant="text" width="60%" height="0.875em" />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({ fields = 4, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width="30%" height="1em" />
          <Skeleton variant="rectangular" width="100%" height={44} />
        </div>
      ))}
      <Skeleton variant="rectangular" width="100%" height={44} />
    </div>
  );
};

export interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const avatarSize = sizeMap[size];

  return <Skeleton variant="circular" width={avatarSize} height={avatarSize} className={className} />;
};

// Custom CSS for wave animation
// This should be added to your global CSS file
export const skeletonWaveStyles = `
@keyframes skeleton-wave {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton-wave {
  background-image: linear-gradient(
    90deg,
    #e5e7eb 0px,
    #f3f4f6 40px,
    #e5e7eb 80px
  );
  background-size: 200px 100%;
  animation: skeleton-wave 1.5s linear infinite;
}
`;
