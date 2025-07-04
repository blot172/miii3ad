import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/context/I18nContext';
import { useTheme } from '@/context/ThemeContext';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function NotFoundScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Cairo-Bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    text: {
      fontSize: 16,
      fontFamily: 'Cairo-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
    link: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    linkText: {
      fontSize: 16,
      fontFamily: 'Cairo-SemiBold',
      color: 'white',
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'خطأ 404' }} />
      <View style={styles.container}>
        <AlertTriangle size={64} color={theme.colors.warning} />
        <Text style={styles.title}>الصفحة غير موجودة</Text>
        <Text style={styles.text}>عذراً، الصفحة التي تبحث عنها غير متاحة.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>العودة للرئيسية</Text>
        </Link>
      </View>
    </>
  );
}
