import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { colors, fonts } from '@/theme/colors';
import OtpRequestScreen from '@/screens/OtpRequestScreen';
import OtpVerifyScreen from '@/screens/OtpVerifyScreen';
import HomeScreen from '@/screens/HomeScreen';
import StoreDetailScreen from '@/screens/StoreDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator({ initialRoute }: { initialRoute: 'Home' | 'OtpRequest' }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: fonts.headingSemi },
        headerBackTitle: '',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="OtpRequest" component={OtpRequestScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: 'تأكيد الرمز' }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
