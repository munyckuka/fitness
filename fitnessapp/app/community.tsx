import { Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "./theme";

const AVATARS = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
];

const CHAT_PREVIEW = [
  { name: "Алексей", message: "сообщение", avatar: AVATARS[0] },
  { name: "Женя", message: "сообщение", avatar: AVATARS[1] },
  { name: "Артем", message: "сообщение", avatar: AVATARS[2] },
  { name: "Олег", message: "сообщение", avatar: AVATARS[4] },
];

export default function Community() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "600", marginTop: 26, marginBottom: 18 }}>
          Сообщество
        </Text>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 14 }}>
          <Image
            source={{ uri: "https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=37.620070,55.753630&z=13&l=map&size=650,430" }}
            style={{ width: "100%", height: 360, borderRadius: 14 }}
            resizeMode="cover"
          />
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 14 }}>
            Пользователи в вашем зале:
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            endFillColor="#FFFFFF"
            fadingEdgeLength={30}
          >
            <View style={{ flexDirection: "row", gap: 14 }}>
              {AVATARS.map((avatar, index) => (
                <Image
                  key={`gym-${index}`}
                  source={{ uri: avatar }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={{ backgroundColor: colors.thirdary, borderRadius: 20, padding: 18, marginTop: 16 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: "500", marginBottom: 14 }}>
            Ваши знакомые
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            endFillColor="#FFFFFF"
            fadingEdgeLength={30}
          >
            <View style={{ flexDirection: "row", gap: 14 }}>
              {AVATARS.map((avatar, index) => (
                <Image
                  key={`friends-${index}`}
                  source={{ uri: avatar }}
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                />
              ))}
            </View>
          </ScrollView>

          <View style={{ width: "100%", height: 2, backgroundColor: "#D8D8D8", marginTop: 8 }} />

          {CHAT_PREVIEW.map((chat) => (
            <TouchableOpacity
              key={chat.name}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/chat",
                  params: {
                    name: chat.name,
                    avatar: chat.avatar,
                  },
                })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 14,
                paddingVertical: 4,
              }}
            >
              <Image source={{ uri: chat.avatar }} style={{ width: 64, height: 64, borderRadius: 32, marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "500" }}>{chat.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>{chat.message}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
