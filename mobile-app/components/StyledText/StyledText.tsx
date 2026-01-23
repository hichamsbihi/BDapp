import React from 'react';

import { Text, TextProps } from '../Themed';

/**
 * Text component with monospace font styling
 */
export const MonoText: React.FC<TextProps> = (props) => {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
};
