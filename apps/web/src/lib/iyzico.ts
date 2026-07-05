/**
 * iyzico server-only helper.
 *
 * SDK: iyzipay@2.0+ (callback based) — Promise wrapper ile modern async/await.
 * Docs: https://dev.iyzipay.com/tr/api
 *
 * Kullanılan endpoint: **Checkout Form Initialize**
 * Kullanıcı yönlendirilmesi + kart bilgisi iyzico hosted form'da alınır.
 * PCI-DSS bizde sorumluluk yok.
 */
import "server-only";
import Iyzipay from "iyzipay";

function getClient() {
  const apiKey = process.env.IYZIPAY_API_KEY;
  const secretKey = process.env.IYZIPAY_SECRET_KEY;
  const uri = process.env.IYZIPAY_BASE_URL ?? "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    throw new Error(
      "IYZIPAY_API_KEY ve IYZIPAY_SECRET_KEY env değişkenleri tanımlı değil.",
    );
  }

  return new Iyzipay({ apiKey, secretKey, uri });
}

// =============================================================================
// TYPES
// =============================================================================

export interface CheckoutFormInitRequest {
  price: string; // "149.00" — ürün toplamı (kargo hariç)
  paidPrice: string; // "164.00" — kullanıcının ödediği (price + shipping) — burası önemli, iyzico bu tutarı çeker
  currency: "TRY" | "USD" | "EUR" | "GBP";
  basketId: string; // bizim order id
  callbackUrl: string; // ödeme sonrası dönüş URL'i
  conversationId: string; // bizim tracking id
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    gsmNumber?: string;
    zipCode?: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode?: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: "PHYSICAL" | "VIRTUAL";
    price: string;
  }>;
}

export interface CheckoutFormInitResult {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  tokenExpireTime?: number;
}

export interface CheckoutFormRetrieveResult {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  paymentStatus?: "SUCCESS" | "FAILURE" | "INIT_THREEDS";
  paymentId?: string;
  fraudStatus?: number;
  price?: number;
  paidPrice?: number;
  installment?: number;
  basketId?: string;
  conversationId?: string;
  currency?: string;
  merchantCommissionRate?: number;
  merchantCommissionRateAmount?: number;
  iyziCommissionRateAmount?: number;
  iyziCommissionFee?: number;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  binNumber?: string;
  lastFourDigits?: string;
  itemTransactions?: unknown[];
  authCode?: string;
  phase?: string;
  hostReference?: string;
}

// =============================================================================
// API
// =============================================================================

/**
 * Ödeme sayfası başlatır. Kullanıcı bu url'e yönlendirilir; iyzico'nun
 * hosted checkout form'unda kartını girer; callback'e döner.
 */
export async function createCheckoutForm(
  req: CheckoutFormInitRequest,
): Promise<CheckoutFormInitResult> {
  const client = getClient();
  return new Promise((resolve, reject) => {
    // @ts-expect-error iyzipay SDK typings incomplete
    client.checkoutFormInitialize.create(req, (err: unknown, result: CheckoutFormInitResult) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Callback URL'de token ile ödeme sonucunu doğrular.
 * Kullanıcının browser'ında session olduğu için manipülasyona güvenmiyoruz;
 * bu server-side doğrulama şart.
 */
export async function retrieveCheckoutForm(
  token: string,
): Promise<CheckoutFormRetrieveResult> {
  const client = getClient();
  return new Promise((resolve, reject) => {
    // @ts-expect-error iyzipay SDK typings incomplete
    client.checkoutForm.retrieve({ token }, (err: unknown, result: CheckoutFormRetrieveResult) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}
