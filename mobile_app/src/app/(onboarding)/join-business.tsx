import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function JoinBusinessScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedStore, setVerifiedStore] = useState<{
    orgName: string;
    inviter: string;
    role: string;
    branch: string;
  } | null>(null);

  const handleLookup = (codeToTest = inviteCode) => {
    const code = codeToTest.trim().toUpperCase();
    if (!code) {
      setError("Please enter the store invite code.");
      setVerifiedStore(null);
      return;
    }

    setError("");
    if (code === "CS-8842" || code === "CS-1234") {
      setVerifiedStore({
        orgName: "Rahim Wholesale & Distribution",
        inviter: "Rahim Uddin (Store Owner)",
        role: "Cashier",
        branch: "Karwan Bazar Warehouse",
      });
    } else if (code === "CS-EXPIRED") {
      setError("This invite code has expired. Please ask your manager for a new invite.");
      setVerifiedStore(null);
    } else {
      setError("Invalid invitation code. Please verify the code from your store manager.");
      setVerifiedStore(null);
    }
  };

  const handleJoinStore = () => {
    if (!verifiedStore) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Route directly into dashboard under newly joined store
      router.replace("/(private)/(tabs)");
    }, 700);
  };

  return (
    <Screen
      keyboard
      edges={["top", "left", "right", "bottom"]}
      header={
        <AppHeader
          title="Join a Store"
          subtitle="Accept team invitation"
          canGoBack
          onBackPress={() => router.back()}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text className="font-poppins-regular text-[13px] text-text-secondary leading-[20px] mb-5">
          Enter the unique 6 to 8 character invitation code provided by your store owner or manager to join their team.
        </Text>

        <TextField
          label="Store Invitation Code"
          value={inviteCode}
          onChangeText={(text) => {
            const formatted = text.toUpperCase();
            setInviteCode(formatted);
            if (error) setError("");
            if (formatted.length >= 6) {
              handleLookup(formatted);
            } else {
              setVerifiedStore(null);
            }
          }}
          placeholder="e.g. CS-8842"
          autoCapitalize="characters"
          error={error}
          leftIcon={<Ionicons name="key-outline" size={18} color={Colors.textMuted} />}
          helperText="Format: CS-XXXX"
        />

        {/* Verified Store Confirmation Card */}
        {verifiedStore ? (
          <Card variant="tinted" padding="md" className="mb-6 border-[#BBF7D0]">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-10 h-10 rounded-xl bg-[#DCFCE7] items-center justify-center mr-3 border border-[#86EFAC]">
                  <Ionicons name="checkmark-done" size={20} color={Colors.success} />
                </View>
                <View className="flex-1">
                  <Text className="font-poppins-semibold text-[16px] text-text-primary">
                    {verifiedStore.orgName}
                  </Text>
                  <Text className="font-poppins-regular text-[12px] text-text-secondary">
                    {verifiedStore.inviter}
                  </Text>
                </View>
              </View>
              <StatusBadge status="active" label={verifiedStore.role} size="sm" />
            </View>

            <View className="p-3 bg-white/70 rounded-xl mb-4 border border-[#BBF7D0]/60">
              <Text className="font-poppins-medium text-[12px] text-text-muted mb-0.5">
                Designated Branch:
              </Text>
              <Text className="font-poppins-semibold text-[13px] text-text-primary">
                {verifiedStore.branch}
              </Text>
            </View>

            <Button
              label={`Join as ${verifiedStore.role}`}
              size="lg"
              variant="primary"
              loading={loading}
              onPress={handleJoinStore}
            />
          </Card>
        ) : null}

        {/* Demo Test Scenarios */}
        <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
          <Text className="font-poppins-medium text-[11px] text-text-muted mb-2.5 uppercase tracking-wider">
            Static Test Invite Codes:
          </Text>
          <View className="gap-2">
            <Button
              label="Test Valid Code (CS-8842)"
              size="sm"
              variant="outline"
              onPress={() => {
                setInviteCode("CS-8842");
                handleLookup("CS-8842");
              }}
            />
            <Button
              label="Test Expired Code (CS-EXPIRED)"
              size="sm"
              variant="outline"
              onPress={() => {
                setInviteCode("CS-EXPIRED");
                handleLookup("CS-EXPIRED");
              }}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
