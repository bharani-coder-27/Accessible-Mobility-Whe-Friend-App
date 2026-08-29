import React, { useContext, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { AuthContext, User } from "../../src/contexts/AuthContext";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useTheme } from "../../src/theme";
import api, { errorMessage } from "../../src/services/api";
import { isValidEmail } from "../../src/utils/validation";
import { Language, languageNames, supportedLanguages } from "../../src/i18n";
import { BrandMark } from "../../src/components/BrandMark";
import {
  Button,
  Screen,
  SegmentedControl,
  Text,
  TextField,
} from "../../src/components/ui";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const { language, setLanguage, t } = useLanguage();
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!email.trim()) next.email = t("emailRequired");
    else if (!isValidEmail(email)) next.email = t("invalidEmail");

    if (!password) next.password = t("passwordRequired");

    return next;
  };

  const handleLogin = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.post<{ user: User; token: string }>("/auth/login", {
        email: email.trim(),
        password,
      });

      if (!data?.user || !data?.token) {
        throw new Error("Malformed login response");
      }

      // The root navigator moves the user to the right home screen as soon as
      // the session lands, so there is nothing to route to here.
      await login(data.user, data.token);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: t("invalidCredentials"),
        text2: errorMessage(error, t("checkConnection")),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll contentStyle={{ justifyContent: "center", gap: theme.spacing.xxl }}>
      <View style={{ gap: theme.spacing.lg }}>
        <BrandMark size={64} />

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display" weight="bold">
            {t("signInTitle")}
          </Text>
          <Text variant="bodyLg" tone="muted">
            {t("signInSubtitle")}
          </Text>
        </View>
      </View>

      {/* Language is offered before sign-in on purpose: a rider who cannot read
          English needs to switch before they can understand the form itself. */}
      <SegmentedControl
        label={t("language")}
        value={language}
        onChange={(value) => setLanguage(value as Language)}
        options={supportedLanguages.map((code) => ({
          value: code,
          label: languageNames[code],
        }))}
      />

      <View style={{ gap: theme.spacing.lg }}>
        <TextField
          label={t("email")}
          icon="mail-outline"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <TextField
          label={t("password")}
          icon="lock-closed-outline"
          secure
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <Button
          label={t("login")}
          onPress={handleLogin}
          loading={submitting}
          size="lg"
          icon="log-in-outline"
        />

        <Button
          label={t("noAccount")}
          onPress={() => router.push("/Auth/RegisterScreen")}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}
