import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Card } from "@/components/ui/Card";

export default function CreateBusinessScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("Grocery & Supermarket");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const [legalName, setLegalName] = useState("");
  const [branchName, setBranchName] = useState("Main Branch");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Grocery & Supermarket",
    "Pharmacy & Healthcare",
    "Fashion & Apparel",
    "Electronics & Mobile",
    "Bakery & Sweets",
    "General Trading",
  ];

  const handleNextStep = () => {
    if (step === 1) {
      if (!storeName.trim()) {
        setError("Please enter your store or business name.");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      setError("");
      setStep(3);
    } else if (step === 3) {
      if (!branchName.trim()) {
        setError("Please name your initial store branch.");
        return;
      }
      setError("");
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
        // Complete store setup and proceed to private dashboard
        router.replace("/(private)/(tabs)");
      }, 800);
    }
  };

  const handleFillDemo = () => {
    setStoreName("Padma Supermarket");
    setLegalName("Padma Retail Enterprises Ltd.");
    setCategory("Grocery & Supermarket");
    setCurrency("BDT");
    setBranchName("Dhanmondi Branch");
    setBranchAddress("House 12, Road 27, Dhanmondi, Dhaka");
    setBranchPhone("+880 1712 998877");
    setError("");
  };

  return (
    <Screen
      keyboard
      edges={["top", "left", "right", "bottom"]}
      header={
        <AppHeader
          title="Create Business"
          subtitle={`Step ${step} of 3`}
          canGoBack
          onBackPress={() => {
            if (step > 1) {
              setStep((prev) => (prev - 1) as 1 | 2 | 3);
            } else {
              router.back();
            }
          }}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Step Progress Bar */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-poppins-semibold text-[13px] text-primary">
              {step === 1
                ? "1. Store Identity"
                : step === 2
                ? "2. Currency & Timezone"
                : "3. Initial Branch Setup"}
            </Text>
            <Text className="font-poppins-medium text-[12px] text-text-muted">
              Step {step} of 3
            </Text>
          </View>
          <View className="h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden flex-row">
            <View
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
            />
          </View>
        </View>

        {/* Step 1: Store Basics */}
        {step === 1 ? (
          <View>
            <TextField
              label="Store / Business Name *"
              value={storeName}
              onChangeText={(text) => {
                setStoreName(text);
                if (error) setError("");
              }}
              placeholder="e.g. Padma Supermarket"
              error={error}
              leftIcon={<Ionicons name="storefront-outline" size={18} color={Colors.textMuted} />}
            />

            <Text className="font-poppins-medium text-[13px] text-text-primary mb-2">
              Business Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                  className={`px-3 py-2 rounded-xl border ${
                    category === cat
                      ? "bg-[#F0FDF4] border-primary"
                      : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <Text
                    className={`font-poppins-medium text-[13px] ${
                      category === cat ? "text-primary" : "text-text-secondary"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Step 2: Currency & Location */}
        {step === 2 ? (
          <View>
            <Text className="font-poppins-medium text-[13px] text-text-primary mb-2">
              Operational Currency *
            </Text>
            <View className="flex-row gap-3 mb-5">
              <TouchableOpacity
                onPress={() => setCurrency("BDT")}
                activeOpacity={0.7}
                className={`flex-1 p-4 rounded-2xl border items-center ${
                  currency === "BDT"
                    ? "bg-[#F0FDF4] border-primary"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                <Text className="font-poppins-bold text-[24px] text-primary mb-1">
                  ৳
                </Text>
                <Text className="font-poppins-semibold text-[14px] text-text-primary">
                  Bangladeshi Taka (BDT)
                </Text>
                <Text className="font-poppins-regular text-[11px] text-text-muted mt-0.5">
                  Default format: ৳ 0,000
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCurrency("USD")}
                activeOpacity={0.7}
                className={`flex-1 p-4 rounded-2xl border items-center ${
                  currency === "USD"
                    ? "bg-[#F0FDF4] border-primary"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                <Text className="font-poppins-bold text-[24px] text-primary mb-1">
                  $
                </Text>
                <Text className="font-poppins-semibold text-[14px] text-text-primary">
                  US Dollar (USD)
                </Text>
                <Text className="font-poppins-regular text-[11px] text-text-muted mt-0.5">
                  Default format: $ 0,000
                </Text>
              </TouchableOpacity>
            </View>

            <TextField
              label="Legal Entity Name (Optional)"
              value={legalName}
              onChangeText={setLegalName}
              placeholder="e.g. Padma Retail Enterprises Ltd."
              helperText="Appears on official customer tax invoices and receipts"
              leftIcon={<Ionicons name="business-outline" size={18} color={Colors.textMuted} />}
            />

            <Card variant="flat" padding="sm" className="border border-[#E2E8F0] mb-4">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <View>
                  <Text className="font-poppins-medium text-[12px] text-text-primary">
                    Default Timezone
                  </Text>
                  <Text className="font-poppins-regular text-[11px] text-text-muted">
                    Asia/Dhaka (GMT+6)
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Step 3: Initial Branch */}
        {step === 3 ? (
          <View>
            <TextField
              label="First Branch Name *"
              value={branchName}
              onChangeText={(text) => {
                setBranchName(text);
                if (error) setError("");
              }}
              placeholder="e.g. Main Outlet / Dhanmondi Branch"
              error={error}
              leftIcon={<Ionicons name="git-branch-outline" size={18} color={Colors.textMuted} />}
            />

            <TextField
              label="Branch Physical Address"
              value={branchAddress}
              onChangeText={setBranchAddress}
              placeholder="e.g. Road 27, Dhanmondi, Dhaka"
              leftIcon={<Ionicons name="location-outline" size={18} color={Colors.textMuted} />}
            />

            <TextField
              label="Branch Contact Phone"
              value={branchPhone}
              onChangeText={setBranchPhone}
              placeholder="e.g. +880 1711 000111"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textMuted} />}
            />
          </View>
        ) : null}

        {/* Navigation Actions */}
        <View className="mt-6 gap-3">
          <Button
            label={step === 3 ? "Complete Store Setup" : "Next Step"}
            size="lg"
            variant="primary"
            loading={loading}
            onPress={handleNextStep}
          />

          {step > 1 ? (
            <Button
              label="Previous Step"
              size="md"
              variant="outline"
              onPress={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
            />
          ) : null}
        </View>

        {/* Quick Demo Autofill */}
        <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
          <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
            Static Prototype Helper:
          </Text>
          <Button
            label="Autofill Store Details"
            size="sm"
            variant="secondary"
            onPress={handleFillDemo}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
