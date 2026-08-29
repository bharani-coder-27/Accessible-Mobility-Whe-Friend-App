import React, { useContext, useMemo, useState } from "react";
import { View } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";

import { AuthContext, User } from "../src/contexts/AuthContext";
import { useLanguage } from "../src/contexts/LanguageContext";
import { useTheme } from "../src/theme";
import api, { errorMessage } from "../src/services/api";
import { isValidPhone, toIsoDate } from "../src/utils/validation";
import {
  AppBar,
  Avatar,
  Badge,
  Button,
  Card,
  Screen,
  Text,
  TextField,
} from "../src/components/ui";

/** Take the YYYY-MM-DD part of whatever date shape the API returns. */
const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : "");

export default function ProfileScreen() {
  const { user, applyUser } = useContext(AuthContext);
  const { t } = useLanguage();
  const theme = useTheme();

  const isConductor = user?.role === "conductor";

  const initial = useMemo(
    () => ({
      name: user?.name ?? "",
      phone_number: user?.phone_number ?? "",
      dob: toDateInput(user?.dob),
      from: user?.from ?? "",
      to: user?.to ?? "",
      trip_code: user?.trip_code ?? "",
      class_of_service: user?.class_of_service ?? "",
    }),
    [user]
  );

  const [values, setValues] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const setField = (key: keyof typeof initial) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) setField("dob")(toIsoDate(selectedDate));
  };

  const cancelEditing = () => {
    // Discard the draft rather than leaving half-typed values in the fields,
    // which would otherwise look like they had been saved.
    setValues(initial);
    setPhoneError(undefined);
    setEditing(false);
  };

  const save = async () => {
    if (values.phone_number && !isValidPhone(values.phone_number)) {
      setPhoneError(t("invalidPhone"));
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put<{ user: User }>("/auth/me", {
        name: values.name.trim(),
        phone_number: values.phone_number.trim(),
        dob: values.dob || null,
        ...(isConductor && {
          from: values.from.trim(),
          to: values.to.trim(),
          trip_code: values.trip_code.trim(),
          class_of_service: values.class_of_service.trim(),
        }),
      });

      if (data?.user) await applyUser(data.user);

      Toast.show({ type: "success", text1: t("profileUpdated") });
      setEditing(false);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("profileUpdateFailed"),
        text2: errorMessage(error, t("checkConnection")),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll padded={false} contentStyle={{ paddingBottom: theme.spacing.xxxl }}>
      <AppBar title={t("profile")} showBack />

      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.xl }}>
        <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
          <Avatar name={values.name} size={88} />
          <Text variant="titleLg" weight="bold" center>
            {values.name}
          </Text>
          <Badge
            label={isConductor ? t("conductor") : t("passenger")}
            tone="primary"
            icon={isConductor ? "bus" : "person"}
          />
        </View>

        <Card style={{ gap: theme.spacing.lg }}>
          <Text variant="title" weight="semibold">
            {t("personalDetails")}
          </Text>

          <TextField
            label={t("fullName")}
            icon="person-outline"
            value={values.name}
            onChangeText={setField("name")}
            editable={editing}
            autoCapitalize="words"
          />

          {/* Email is the account identity and is not editable here, so it is
              shown as text rather than a disabled input the user will try to tap. */}
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="footnote" weight="medium" tone="muted">
              {t("email")}
            </Text>
            <Text variant="bodyLg">{user?.email}</Text>
          </View>

          <TextField
            label={t("phone")}
            icon="call-outline"
            value={values.phone_number}
            onChangeText={(value) => {
              setField("phone_number")(value);
              setPhoneError(undefined);
            }}
            error={phoneError}
            editable={editing}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <TextField
            label={t("dob")}
            icon="calendar-outline"
            value={values.dob}
            editable={editing}
            onPress={editing ? () => setShowDatePicker(true) : undefined}
            placeholder="YYYY-MM-DD"
          />

          {showDatePicker && (
            <DateTimePicker
              value={values.dob ? new Date(values.dob) : new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}
        </Card>

        {isConductor && (
          <Card style={{ gap: theme.spacing.lg }}>
            <Text variant="title" weight="semibold">
              {t("routeDetails")}
            </Text>

            <TextField
              label={t("routeFrom")}
              icon="navigate-outline"
              value={values.from}
              onChangeText={setField("from")}
              editable={editing}
              autoCapitalize="words"
            />
            <TextField
              label={t("routeTo")}
              icon="flag-outline"
              value={values.to}
              onChangeText={setField("to")}
              editable={editing}
              autoCapitalize="words"
            />
            <TextField
              label={t("tripCode")}
              icon="pricetag-outline"
              value={values.trip_code}
              onChangeText={setField("trip_code")}
              editable={editing}
              autoCapitalize="characters"
            />
            <TextField
              label={t("classOfService")}
              icon="bus-outline"
              value={values.class_of_service}
              onChangeText={setField("class_of_service")}
              editable={editing}
              autoCapitalize="words"
            />
          </Card>
        )}

        {editing ? (
          <View style={{ gap: theme.spacing.md }}>
            <Button
              label={t("saveChanges")}
              onPress={save}
              loading={saving}
              size="lg"
              icon="checkmark-outline"
            />
            <Button label={t("cancel")} onPress={cancelEditing} variant="ghost" />
          </View>
        ) : (
          <Button
            label={t("editProfile")}
            onPress={() => setEditing(true)}
            variant="secondary"
            size="lg"
            icon="create-outline"
          />
        )}
      </View>
    </Screen>
  );
}
