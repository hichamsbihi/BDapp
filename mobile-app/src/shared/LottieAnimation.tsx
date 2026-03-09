import React, { useRef, useEffect } from 'react';
import { ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

/**
 * Available animation presets bundled with the app.
 * These are lightweight JSON files (~2-5kb each), not network requests.
 */
const ANIMATIONS = {
  'stars-burst': require('@/assets/animations/stars-burst.json'),
  'sparkle-loop': require('@/assets/animations/sparkle-loop.json'),
} as const;

export type AnimationName = keyof typeof ANIMATIONS;

interface LottieAnimationProps {
  name: AnimationName;
  /** Play once then stop (default: false = loop) */
  autoPlay?: boolean;
  loop?: boolean;
  size?: number;
  style?: ViewStyle;
  /** Called when a non-looping animation finishes */
  onFinish?: () => void;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  name,
  autoPlay = true,
  loop = true,
  size = 120,
  style,
  onFinish,
}) => {
  const ref = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay) {
      ref.current?.play();
    }
  }, [autoPlay]);

  return (
    <LottieView
      ref={ref}
      source={ANIMATIONS[name]}
      autoPlay={autoPlay}
      loop={loop}
      onAnimationFinish={onFinish}
      style={[{ width: size, height: size }, style]}
    />
  );
};
