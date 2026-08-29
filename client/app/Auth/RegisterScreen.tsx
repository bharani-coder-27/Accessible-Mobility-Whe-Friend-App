import React, { useContext, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";

import { AuthContext, Role, User } from "../../src/contexts/AuthContext";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import api, { errorMessage } from "../../src/services/api";
import {
  isAlphanumeric,
  isStrongEnough,
  isValidDate,
  isValidEmail,
  isValidPhone,
  toIsoDate,
} from "../../src/utils/validation";
import {
  AppBar,
  Button,
  Card,
  Screen,
  SegmentedControl,
  Text,
  TextField,
} from "../../src/components/ui";

type FieldKey =
  | "name"
  | "phone"
  | "dob"
  | "email"
  | "password"
  | "confirmPassword"
  | "from"
  | "to"
  | "tripCode"
  | "classOfService"
  | "deviceId";

type FieldErrors = Partial<Record<FieldKey, string>>;

/** Nobody using a bus service is under one year old; guards against typos. */
const latestAllowedDob = new Date(
  new Date().getFullYear() - 1,
  new Date().getMonth(),
  new Date().getDate()
);

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const { t } = useLanguage();
  const theme = useTheme();

  const [role, setRole] = useState<Role>("passenger");
  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: "",
    phone: "",
    dob: "",
    email: "",
    password: "",
    confirmPassword: "",
    from: "",
    to: "",
    tripCode: "",
    classOfService: "",
    deviceId: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isConductor = role === "conductor";

  const setField = (key: FieldKey) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear the error as soon as the user starts fixing it, rather than
    // leaving a stale red message under a field they have already corrected.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setField("dob")(toIsoDate(selectedDate));
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!values.name.trim()) next.name = t("nameRequired");
    if (!isValidPhone(values.phone)) next.phone = t("invalidPhone");
    if (!isValidDate(values.dob)) next.dob = t("dobRequired");
    if (!isValidEmail(values.email)) next.email = t("invalidEmail");
    if (!isStrongEnough(values.password)) next.password = t("passwordTooShort");
    if (values.password !== values.confirmPassword) {
      next.confirmPassword = t("passwordMismatch");
    }

    if (isConductor) {
      if (!values.from.trim()) next.from = t("conductorFieldsRequired");
      if (!values.to.trim()) next.to = t("conductorFieldsRequired");
      if (!values.tripCode.trim()) next.tripCode = t("conductorFieldsRequired");
      if (!values.classOfService.trim()) next.classOfService = t("conductorFieldsRequired");
      if (!values.deviceId.trim()) next.deviceId = t("conductorFieldsRequired");
      else if (!isAlphanumeric(values.deviceId)) next.deviceId = t("deviceIdInvalid");
    }

    return next;
  };

  const handleRegister = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.post<{ user?: User; token?: string }>("/auth/register", {
        name: values.name.trim(),
        email: values.email.trim(),
        phone_number: values.phone.trim(),
        dob: values.dob,
        password: values.password,
        role,
        is_active: true,
        ...(isConductor && {
          from: values.from.trim(),
          to: values.to.trim(),
          tripCode: values.tripCode.trim(),
          classOfService: values.classOfService.trim(),
          deviceId: values.deviceId.trim(),
        }),
      });

      if (data?.user && data?.token) {
        // Registration returns a session, so drop straight into the app rather
        // than sending the user to sign in with credentials they just chose.
        await login(data.user, data.token);
        return;
      }

      router.replace("/Auth/LoginScreen");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("registrationFailed"),
        text2: errorMessage(error, t("checkConnection")),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = useMemo(
    () => [
      { value: "passenger" as const, label: t("passenger"), icon: "person-outline" as const },
      { value: "conductor" as const, label: t("conductor"), icon: "bus-outline" as const },
    ],
    [t]
  );

  return (
    <Screen
      scroll
      padded={false}
      header={<AppBar title={t("registerTitle")} subtitle={t("registerSubtitle")} showBack />}
      contentStyle={{ paddingBottom: theme.spacing.xxxl }}
    >
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.xxl }}>
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="footnote" weight="medium" tone="muted">
            {t("accountType")}
          </Text>
          <SegmentedControl
            label={t("accountType")}
            value={role}
            onChange={setRole}
            options={roleOptions}
          />
        </View>

        <View style={{ gap: theme.spacing.lg }}>
          <TextField
            label={t("fullName")}
            icon="person-outline"
            required
            value={values.name}
            onChangeText={setField("name")}
            error={errors.name}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />

          <TextField
            label={t("phone")}
            icon="call-outline"
            required
            hint={t("phoneHint")}
            value={values.phone}
            onChangeText={setField("phone")}
            error={errors.phone}
            keyboardType="phone-pad"
            maxLength={10}
            autoComplete="tel"
          />

          <TextField
            label={t("dob")}
            icon="calendar-outline"
            required
            hint={t("dobHint")}
            value={values.dob}
            error={errors.dob}
            onPress={() => setShowDatePicker(true)}
            placeholder="YYYY-MM-DD"
          />

          {showDatePicker && (
            <DateTimePicker
              value={values.dob ? new Date(values.dob) : latestAllowedDob}
              mode="date"
              maximumDate={latestAllowedDob}
              onChange={onDateChange}
            />
          )}

          <TextField
            label={t("email")}
            icon="mail-outline"
            required
            value={values.email}
            onChangeText={setField("email")}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <TextField
            label={t("password")}
            icon="lock-closed-outline"
            required
            secure
            hint={t("passwordHint")}
            value={values.password}
            onChangeText={setField("password")}
            error={errors.password}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <TextField
            label={t("confirmPassword")}
            icon="lock-closed-outline"
            required
            secure
            value={values.confirmPassword}
            onChangeText={setField("confirmPassword")}
            error={errors.confirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
          />
        </View>

        {isConductor && (
          <Card variant="alt" style={{ gap: theme.spacing.lg }}>
            <Text variant="title" weight="semibold">
              {t("conductorDetails")}
            </Text>

            <TextField
              label={t("routeFrom")}
              icon="navigate-outline"
              required
              value={values.from}
              onChangeText={setField("from")}
              error={errors.from}
              autoCapitalize="words"
            />

            <TextField
              label={t("routeTo")}
              icon="flag-outline"
              required
              value={values.to}
              onChangeText={setField("to")}
              error={errors.to}
              autoCapitalize="words"
            />

            <TextField
              label={t("tripCode")}
              icon="pricetag-outline"
              required
              value={values.tripCode}
              onChangeText={setField("tripCode")}
              error={errors.tripCode}
              autoCapitalize="characters"
            />

            <TextField
              label={t("classOfService")}
              icon="bus-outline"
              required
              value={values.classOfService}
              onChangeText={setField("classOfService")}
              error={errors.classOfService}
              autoCapitalize="words"
            />

            <TextField
              label={t("deviceId")}
              icon="hardware-chip-outline"
              required
              value={values.deviceId}
              onChangeText={setField("deviceId")}
              error={errors.deviceId}
              autoCapitalize="characters"
            />
          </Card>
        )}

        <View style={{ gap: theme.spacing.md }}>
          <Button
            label={t("createAccount")}
            onPress={handleRegister}
            loading={submitting}
            size="lg"
            icon="checkmark-circle-outline"
          />

          <Button
            label={t("haveAccount")}
            onPress={() => router.replace("/Auth/LoginScreen")}
            variant="ghost"
          />
        </View>
      </View>
    </Screen>
  );
}
