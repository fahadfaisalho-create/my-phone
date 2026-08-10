// الشاشة والمعطيات اللي نرجع لها المستهلك بعد تسجيل الدخول (لو وصل لصفحة الدخول أثناء تصفحه كضيف)
export type ReturnTo = { screen: keyof RootStackParamList; params?: object };

export type RootStackParamList = {
  OtpRequest: { returnTo?: ReturnTo } | undefined;
  OtpVerify: { phone: string; devOtp?: string; returnTo?: ReturnTo };
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
