import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/features/auth/auth.slice";
import { Colors } from "@/constants/colors";
import { Screen } from "@/components/layout/Screen";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  staticInvitations,
  staticOrganizationsList,
  useStaticData,
  type StaticOrganization,
} from "@/staticData";

type OrgScenario = "multiple" | "invited" | "no_org" | "revoked";

export default function OrganizationsScreen() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const { scenario } = useStaticData();

  const [activeScenario, setActiveScenario] = useState<OrgScenario>("multiple");
  const [invitations, setInvitations] = useState(staticInvitations);

  const handleSelectOrg = (org: StaticOrganization) => {
    if (org.branches.length > 1) {
      router.push({
        pathname: "/(onboarding)/select-branch",
        params: { orgId: org.id },
      });
    } else {
      router.replace("/(private)/(tabs)");
    }
  };

  const handleAcceptInvite = (inviteId: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    router.replace("/(private)/(tabs)");
  };

  const handleDeclineInvite = (inviteId: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
  };

  const handleSignOut = () => {
    dispatch(logout());
    router.replace("/(auth)/login");
  };

  return (
    <Screen
      edges={["top", "left", "right", "bottom"]}
      header={
        <AppHeader
          title="Select Store"
          subtitle={authUser?.email ?? scenario.currentUser.email}
          rightElement={
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] items-center justify-center"
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Scenario Switcher for Verification & Interactive Testing */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-poppins-medium text-[11px] text-text-muted uppercase tracking-wider">
            Demo Scenario:
          </Text>
          <View className="flex-row gap-1.5">
            {(
              [
                { id: "multiple", label: "Multi-Store" },
                { id: "invited", label: "Pending Invite" },
                { id: "no_org", label: "No Store" },
                { id: "revoked", label: "Revoked" },
              ] as { id: OrgScenario; label: string }[]
            ).map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setActiveScenario(item.id)}
                activeOpacity={0.7}
                className={`px-2 py-0.5 rounded-full border ${
                  activeScenario === item.id
                    ? "bg-primary border-primary"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                <Text
                  className={`font-poppins-medium text-[10px] ${
                    activeScenario === item.id ? "text-white" : "text-text-secondary"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 1. Revoked Membership Alert Scenario */}
        {activeScenario === "revoked" ? (
          <Card className="mb-5 border-[#FECACA] bg-[#FEF2F2]">
            <View className="flex-row items-start">
              <Ionicons
                name="alert-circle"
                size={22}
                color={Colors.error}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="font-poppins-semibold text-[14px] text-[#B91C1C]">
                  Membership Revoked
                </Text>
                <Text className="font-poppins-regular text-[12px] text-[#7F1D1D] leading-[18px] mt-0.5">
                  Your staff access to &quot;Chittagong GEC Hub&quot; was revoked by the store
                  administrator. If you believe this is a mistake, contact your store manager.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* 2. Pending Invitation Banner Scenario */}
        {activeScenario === "invited" && invitations.length > 0 ? (
          <View className="mb-6">
            <Text className="font-poppins-semibold text-[15px] text-text-primary mb-2">
              Pending Invitations ({invitations.length})
            </Text>
            {invitations.map((inv) => (
              <Card
                key={inv.id}
                variant="tinted"
                padding="md"
                className="mb-3 border-[#BBF7D0]"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1 pr-2">
                    <Text className="font-poppins-bold text-[16px] text-text-primary">
                      {inv.organizationName}
                    </Text>
                    <Text className="font-poppins-regular text-[12px] text-text-secondary mt-0.5">
                      Invited by {inv.inviterName} • Branch: {inv.branchName}
                    </Text>
                  </View>
                  <StatusBadge status="active" label={inv.role} size="sm" />
                </View>

                <View className="flex-row gap-2 mt-3 pt-3 border-t border-[#BBF7D0]/60">
                  <Button
                    label="Accept Invitation"
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onPress={() => handleAcceptInvite(inv.id)}
                  />
                  <Button
                    label="Decline"
                    size="sm"
                    variant="ghost"
                    className="px-4"
                    onPress={() => handleDeclineInvite(inv.id)}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* 3. Organizations List or Empty State */}
        {activeScenario === "no_org" ? (
          <EmptyState
            title="No Store Found"
            description="You are not a member of any retail store yet. Create your first store or join with an invite code from your manager."
            iconName="storefront-outline"
            actionLabel="Create a Store"
            onActionPress={() => router.push("/(onboarding)/create-business")}
          />
        ) : (
          <View>
            <Text className="font-poppins-semibold text-[15px] text-text-primary mb-3">
              Your Stores
            </Text>

            <View className="gap-3">
              {(activeScenario === "revoked"
                ? staticOrganizationsList.slice(0, 1)
                : staticOrganizationsList
              ).map((org) => (
                <Card
                  key={org.id}
                  padding="md"
                  onPress={() => handleSelectOrg(org)}
                  accessibilityLabel={`Select store ${org.name}`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="w-11 h-11 rounded-xl bg-[#F0FDF4] items-center justify-center mr-3 border border-[#BBF7D0]">
                        <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="font-poppins-semibold text-[16px] text-text-primary"
                        >
                          {org.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="font-poppins-regular text-[12px] text-text-muted mt-0.5"
                        >
                          {org.legalName}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge
                      status={org.role === "OWNER" ? "paid" : "active"}
                      label={org.role}
                      size="sm"
                    />
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-[#F1F5F9] mt-1">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="git-branch-outline"
                        size={15}
                        color={Colors.textMuted}
                        style={{ marginRight: 4 }}
                      />
                      <Text className="font-poppins-regular text-[12px] text-text-secondary">
                        {org.branches.length}{" "}
                        {org.branches.length === 1 ? "Branch" : "Branches"}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Text className="font-poppins-medium text-[13px] text-primary mr-1">
                        Open Store
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* 4. Action Buttons at Bottom */}
        <View className="mt-8 gap-3">
          <Button
            label="+ Create New Business"
            size="lg"
            variant="primary"
            leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />}
            onPress={() => router.push("/(onboarding)/create-business")}
          />

          <Button
            label="Join Store with Invite Code"
            size="md"
            variant="outline"
            leftIcon={<Ionicons name="key-outline" size={18} color={Colors.primary} />}
            onPress={() => router.push("/(onboarding)/join-business")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
