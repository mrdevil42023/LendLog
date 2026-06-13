import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({ children, style }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      try {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }).start();
      } catch {}
    }, [])
  );

  return (
    <Animated.View style={[{ flex: 1 }, style, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
}
