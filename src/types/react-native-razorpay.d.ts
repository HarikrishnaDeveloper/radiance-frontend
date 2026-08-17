// react-native-razorpay ships its TS sources under src/ but doesn't publish a
// `types` field in package.json, so TS can't resolve them automatically.
declare module 'react-native-razorpay' {
  export type RazorpayOptions = {
    key: string;
    amount: number | string;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: { [key: string]: string };
    theme?: { color?: string; hide_topbar?: boolean };
    modal?: {
      backdropclose?: boolean;
      escape?: boolean;
      handleback?: boolean;
      confirm_close?: boolean;
      ondismiss?: () => void;
      animation?: boolean;
    };
    subscription_id?: string;
    subscription_card_change?: boolean;
    recurring?: boolean | string;
    callback_url?: string;
    redirect?: boolean;
    customer_id?: string;
    remember_customer?: boolean;
    timeout?: number;
    readonly?: { email?: boolean; contact?: boolean; name?: boolean };
    hidden?: { email?: boolean; contact?: boolean };
    [key: string]: unknown;
  };

  export type PaymentSuccessData = {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
    [key: string]: unknown;
  };

  export type PaymentErrorData = {
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: { order_id?: string; payment_id?: string; [key: string]: unknown };
  };

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<PaymentSuccessData>;
  };

  export default RazorpayCheckout;
}
