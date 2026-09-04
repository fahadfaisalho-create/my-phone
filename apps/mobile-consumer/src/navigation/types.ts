// الشاشة والمعطيات اللي نرجع لها المستهلك بعد تسجيل الدخول (لو وصل لصفحة الدخول أثناء تصفحه كضيف)
export type ReturnTo = { screen: keyof RootStackParamList; params?: object };

export type RootStackParamList = {
  AuthPhone: { returnTo?: ReturnTo } | undefined;
  // registered: جاية من شاشة إدخال الجوال بعد ما تحقق النظام هل الرقم مسجّل
  // (يعرض خانة كلمة السر فقط) أو لا (يعرض خانتي كلمة السر + الاسم لحساب جديد)
  AuthPassword: { phone: string; registered: boolean; returnTo?: ReturnTo };
  Home: undefined;
  // product/technician: معرّف اختياري يصل عبر رابط مشاركة مباشر (من لوحة
  // التاجر) — يمرّر الشاشة تلقائياً لعنصر المنتج/الفني المقصود ويميّزه
  StoreDetail: { storeId: string; product?: string; technician?: string };
  ChatList: undefined;
  ChatThread: { chatId: string; storeName: string };
  MyBookings: undefined;
  Booking: { storeId: string; storeName: string; serviceId: string; serviceName: string };
  Cart: { storeId: string; storeName: string };
  MyOrders: undefined;
  Invoice: { orderId: string };
  Support: undefined;
  Profile: undefined;
};
