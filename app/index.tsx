import { Link, router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function Index() {
  useEffect(() => {
    // Automatically redirect to home tab after a brief moment
    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 1000); // 1 second delay to show the welcome message

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
      className="bg-primary-200"
    >
      <Text className="text-5xl font-bold text-primary-950">Velkommen</Text>
      <Link href="/(tabs)/home" className="text-3xl text-primary-900 mt-3">Start</Link>
    </View>
  );
}
