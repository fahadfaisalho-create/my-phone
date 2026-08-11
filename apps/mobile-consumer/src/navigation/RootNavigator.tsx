import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { colors, fonts } from '@/theme/colors';
import OtpRequestScreen from '@/screens/OtpRequestScreen';
import OtpVerifyScreen from '@/screens/OtpVerifyScreen';
import HomeScreen from '@/screens/HomeScreen';
import StoreDetailScreen from '@/screens/StoreDetailScreen';
import ChatListScreen from '@/screens/ChatListScreen';
import ChatThreadScreen from '@/screens/ChatThreadScreen';
import BookingScreen from '@/screens/BookingScreen';
import MyBookingsScreen from '@/screens/MyBookingsScreen';
import CartScreen from '@/screens/CartScreen';
import MyOrdersScreen from '@/screens/MyOrdersScreen';
import InvoiceScreen from '@/screens/InvoiceScreen';
import SupportScreen from '@/screens/SupportScreen';
import ProfileScreen from '@/screens/ProfileScreen';

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
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'محادثاتي' }} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} options={{ title: '' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'حجز موعد' }} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'حجوزاتي' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'السلة' }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'طلباتي' }} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} options={{ title: 'الفاتورة' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'الدعم' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'حسابي' }} />
    </Stack.Navigator>
  );
}
