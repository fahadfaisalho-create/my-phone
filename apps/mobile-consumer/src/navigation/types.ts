export type RootStackParamList = {
  OtpRequest: undefined;
  OtpVerify: { phone: string; devOtp?: string };
  Home: undefined;
  StoreDetail: { storeId: string };
};
