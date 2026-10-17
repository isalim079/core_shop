import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  staticOrganizationsList,
  useStaticData,
  type StaticBranch,
} from "@/staticData";

export default function SelectBranchScreen() {
  const params = useLocalSearchParams<{ orgId?: string }>();
  const { scenario } = useStaticData();

  const org =
    staticOrganizationsList.find((o) => o.id === params.orgId) ??
    scenario.organization;

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    org.branches[0]?.id ?? ""
  );
  const [hasNoBranchScenario, setHasNoBranchScenario] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirmBranch = (branch?: StaticBranch) => {
    const finalBranchId = branch ? branch.id : selectedBranchId;
    if (!finalBranchId) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Route into main operational tabs with selected branch context
      router.replace("/(private)/(tabs)");
    }, 500);
  };

  return (
    <Screen
      edges={["top", "left", "right", "bottom"]}
      header={
        <AppHeader
          title="Select Branch"
          subtitle={org.name}
          canGoBack
          onBackPress={() => router.back()}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text className="font-poppins-regular text-[13px] text-text-secondary leading-[20px] mb-4">
          Choose which branch outlet you are operating today. You can switch branches anytime from settings.
        </Text>

        {hasNoBranchScenario ? (
          /* No Branch Assigned Error Scenario */
          <Card className="mb-6">
            <EmptyState
              title="No Branch Assigned"
              description={`You are a member of ${org.name}, but an administrator has not assigned you to any branch yet.`}
              iconName="git-branch-outline"
              actionLabel="Contact Store Manager"
              onActionPress={() => {}}
            />
          </Card>
        ) : (
          /* Branch Cards List */
          <View className="gap-3 mb-6">
            {org.branches.map((branch) => {
              const isSelected = branch.id === selectedBranchId;
              return (
                <Card
                  key={branch.id}
                  padding="md"
                  onPress={() => {
                    setSelectedBranchId(branch.id);
                    handleConfirmBranch(branch);
                  }}
                  className={`border ${
                    isSelected ? "border-primary bg-[#F0FDF4]/40" : "border-[#E2E8F0]"
                  }`}
                  accessibilityLabel={`Branch ${branch.name}`}
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className="flex-row items-center flex-1 pr-2">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isSelected ? "bg-primary" : "bg-[#F1F5F9]"
                        }`}
                      >
                        <Ionicons
                          name="git-branch"
                          size={18}
                          color={isSelected ? "#FFFFFF" : Colors.textSecondary}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="font-poppins-semibold text-[15px] text-text-primary mr-2">
                            {branch.name}
                          </Text>
                          {branch.isMain ? (
                            <View className="px-1.5 py-0.5 rounded bg-[#DCFCE7] border border-[#86EFAC]">
                              <Text className="font-poppins-semibold text-[10px] text-[#15803D]">
                                MAIN
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="font-poppins-medium text-[11px] text-text-muted mt-0.5">
                          Code: {branch.code}
                        </Text>
                      </View>
                    </View>

                    {/* Radio / Check indicator */}
                    <View
                      className={`w-6 h-6 rounded-full border items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-[#CBD5E1] bg-white"
                      }`}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </View>

                  <View className="pt-2.5 border-t border-[#F1F5F9] mt-2 flex-row items-center">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={Colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      numberOfLines={1}
                      className="font-poppins-regular text-[12px] text-text-muted flex-1"
                    >
                      {branch.address}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <Button
          label="Open Branch Dashboard"
          size="lg"
          variant="primary"
          loading={loading}
          disabled={hasNoBranchScenario}
          onPress={() => handleConfirmBranch()}
        />

        {/* Prototype Testing Scenario Toggle */}
        <Card variant="flat" padding="sm" className="mt-8 border border-[#E2E8F0]">
          <Text className="font-poppins-medium text-[11px] text-text-muted mb-2 uppercase tracking-wider">
            Static Scenario Testing:
          </Text>
          <Button
            label={
              hasNoBranchScenario
                ? "Switch back to Normal Branches"
                : "Simulate 'No Branch Assigned' Scenario"
            }
            size="sm"
            variant="outline"
            onPress={() => setHasNoBranchScenario(!hasNoBranchScenario)}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
