export type RootStackParamList = {
  OtpRequest: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Home: undefined;
  StoreDetail: { storeId: string };
  ChatList: undefined;
  ChatThread: { chatId: string; storeName: string };
  MyBookings: undefined;
  Booking: { storeId: string; storeName: string; serviceId: string; serviceName: string };
  Cart: { storeId: string; storeName: string };
  MyOrders: undefined;
  Support: undefined;
  Profile: undefined;
};
