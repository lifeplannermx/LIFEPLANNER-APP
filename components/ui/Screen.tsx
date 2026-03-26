import { ReactNode } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING } from "@/constants/app";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padding?: boolean;
  centered?: boolean;
  style?: ViewStyle;
  keyboardAvoiding?: boolean;
};

export function Screen({
  children,
  scroll = false,
  padding = true,
  centered = false,
  style,
  keyboardAvoiding = false,
}: ScreenProps) {
  const content = (
    <View
      style={[
        styles.inner,
        padding && styles.padding,
        centered && styles.centered,
        style,
      ]}
    >
      {children}
    </View>
  );

  const scrollContent = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  const keyboardContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      {scrollContent}
    </KeyboardAvoidingView>
  ) : (
    scrollContent
  );

  return (
    <SafeAreaView style={styles.container}>{keyboardContent}</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: SPACING.lg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
});
