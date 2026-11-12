/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export declare enum TobeShopStatus {
  PENDING = "PENDING",
  REGISTERED = "REGISTERED",
  CANCELED = "CANCELED",
}
export declare enum ImageContentType {
  ImageJpeg = "image/jpeg",
  ImagePng = "image/png",
  ImageWebp = "image/webp",
}
export declare enum TicketStatus {
  PENDING = "PENDING",
  ANSWERED = "ANSWERED",
  CLOSED = "CLOSED",
}
export declare enum PaidService {
  SHAHKAR = "SHAHKAR",
  CARD_MATCH = "CARD_MATCH",
  SMS = "SMS",
}
export declare enum WalletTransactionType {
  TOP_UP = "TOP_UP",
  SERVICE_CHARGE = "SERVICE_CHARGE",
  ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT",
}
export interface ServiceCostSettingsModel {
  /** Tomans per Shahkar check (mobile ↔ national code). */
  shahkarCost: number;
  /** Tomans per bank card check (CardMatch: card ↔ national code + birth date). */
  cardMatchCost: number;
  /** Tomans per SMS sent to a customer. */
  smsCost: number;
}
export interface VatSettingsModel {
  /** Whole percent added to the amount the owner pays (10 → 50,000 + 5,000 Tomans). */
  vatPercent: number;
}
export interface PaymentCallbackInput {
  /** 1 paid, 0 not paid */
  status: PaymentCallbackInputStatusEnum;
  paymentNumber: string;
  /** Our payment row id */
  invoiceNumber: string;
  /** Rials */
  amount?: number;
  cardNumber?: string;
  referenceNumber?: string;
}
export interface StartWalletTopUpInput {
  /**
   * Tomans to add to the wallet
   * @min 10000
   * @max 200000000
   */
  amount: number;
}
export interface WalletTopUpModel {
  url: string;
}
export interface ReadWalletTransactionsInput {
  /** @default 1 */
  page?: number;
}
export interface WalletTransactionModel {
  id: string;
  type: WalletTransactionType;
  amount: string;
  service: PaidService | null;
  customerSsn: string | null;
  refId: string | null;
  /** @format date-time */
  createdAt: string;
}
export interface ReadWalletTransactionsOutput {
  data: WalletTransactionModel[];
  count: number;
  pageSize: number;
}
export interface ReadShopWalletTransactionsInput {
  /** @default 1 */
  page?: number;
  shopId: string;
}
export interface SendOtpInput {
  /** @example "09120000000" */
  phoneNumber: string;
}
export interface OtpSentModel {
  phoneNumber: string;
  /** Seconds until the code expires */
  expiresInSeconds: number;
}
export interface ExchangeOtpInput {
  /** @example "09120000000" */
  phoneNumber: string;
  /** @example "123456" */
  code: string;
}
export interface MeModel {
  /**
   * "admin" or "shop"
   * @example "admin"
   */
  role: string;
  phoneNumber: string;
  shopId?: string;
}
export interface TokenModel {
  token: string;
  me: MeModel;
}
export interface SendShopOtpInput {
  /** @example "setoode" */
  subdomain: string;
  /** @example "09120000000" */
  phoneNumber: string;
}
export interface ExchangeShopOtpInput {
  /** @example "setoode" */
  subdomain: string;
  /** @example "09120000000" */
  phoneNumber: string;
  /** @example "123456" */
  code: string;
}
export interface CreateShopInput {
  /** نام فروشگاه */
  name: string;
  /** نام برند */
  brandName: string;
  /**
   * setoode → setoode.zarimen.ir
   * @example "setoode"
   */
  subdomain: string;
  /** Public URL returned by createImageUpload */
  logoUrl?: string;
  address?: string;
  /** @example "02112345678" */
  landline?: string;
  ownerFullName: string;
  /** @example "09120000000" */
  ownerPhoneNumber: string;
  /** @example "0499370899" */
  ownerNationalCode: string;
  /**
   * Initial wallet balance in Tomans. Defaults to 0.
   * @example "1500000"
   */
  initialWalletBalance?: string;
}
export interface ShopModel {
  id: string;
  name: string;
  brandName: string;
  subdomain: string;
  isActive: boolean;
  /** @format date-time */
  subscriptionEndsAt: string | null;
  logoUrl: string | null;
  address: string | null;
  landline: string | null;
  ownerFullName: string;
  ownerPhoneNumber: string;
  ownerNationalCode: string;
  walletBalance: string;
  /** @format date-time */
  createdAt: string;
}
export interface UpdateShopInput {
  /** نام فروشگاه */
  name: string;
  /** نام برند */
  brandName: string;
  /** Public URL returned by createImageUpload */
  logoUrl?: string;
  address?: string;
  /** @example "02112345678" */
  landline?: string;
  ownerFullName: string;
  shopId: string;
}
export interface SetShopActiveInput {
  id: string;
  isActive: boolean;
}
export interface SetWalletBalanceInput {
  shopId: string;
  /** @example "1500000" */
  balance: string;
}
export interface ReadShopPublicInfoInput {
  /** @example "setoode" */
  subdomain: string;
}
export interface ShopPublicInfoModel {
  name: string;
  brandName: string;
  logoUrl: string | null;
  address: string | null;
  landline: string | null;
  ownerFullName: string;
  ownerPhoneNumber: string;
  isActive: boolean;
  hasActiveSubscription: boolean;
}
export interface StartSignupInput {
  /** @example "setoode" */
  subdomain: string;
  /** @example "0499370899" */
  ssn: string;
  /** @example "09120000000" */
  phoneNumber: string;
  /**
   * Jalali YYYY/MM/DD
   * @example "1370/01/05"
   */
  birthDate: string;
}
export interface SignupStartedModel {
  ticket: string;
  phoneNumber: string;
  /** Seconds until the SMS code expires */
  expiresInSeconds: number;
}
export interface CompleteSignupInput {
  ticket: string;
  /** @example "123456" */
  code: string;
}
export interface CustomerTokenModel {
  token: string;
  expiresInSeconds: number;
}
export interface StartLoginInput {
  /** @example "setoode" */
  subdomain: string;
  /** @example "09120000000" */
  phoneNumber: string;
}
export interface CompleteLoginInput {
  /** @example "setoode" */
  subdomain: string;
  /** @example "09120000000" */
  phoneNumber: string;
  /** @example "123456" */
  code: string;
}
export interface CustomerCardModel {
  id: string;
  maskedNumber: string;
  bankName: string | null;
  /** @format date-time */
  createdAt: string;
}
export interface CustomerCardsModel {
  phoneNumber: string;
  cards: CustomerCardModel[];
}
export interface AddCardInput {
  /** @example "6037997599999993" */
  cardNumber: string;
}
export interface ReadMyCustomersInput {
  /** @example "0912" */
  search?: string;
}
export interface ShopCustomerModel {
  id: string;
  ssn: string;
  phoneNumber: string;
  /** Jalali YYYY/MM/DD */
  birthDate: string;
  /** @format date-time */
  firstSeenAt: string;
  /** @format date-time */
  lastSeenAt: string;
  cardCount: number;
}
export interface ReadMyCustomerCardsInput {
  customerId: string;
}
export interface ShopCustomerCardModel {
  id: string;
  cardNumber: string;
  bankName: string | null;
  /** @format date-time */
  createdAt: string;
}
export interface CheckCardManuallyInput {
  /** @example "0499370899" */
  ssn: string;
  /**
   * Jalali YYYY/MM/DD
   * @example "1370/01/05"
   */
  birthDate: string;
  /** @example "6037997599999993" */
  cardNumber: string;
}
export interface ManualCardCheckModel {
  matched: boolean;
  bankName: string | null;
}
export interface ReadManualCardChecksInput {
  /** @default 1 */
  page?: number;
}
export interface ManualCardCheckRecordModel {
  matched: boolean;
  bankName: string | null;
  id: string;
  ssn: string;
  /** Jalali YYYY/MM/DD */
  birthDate: string;
  cardNumber: string;
  /** @format date-time */
  createdAt: string;
}
export interface ReadManualCardChecksOutput {
  data: ManualCardCheckRecordModel[];
  count: number;
  pageSize: number;
}
export interface ReadShopCustomersInput {
  /** @example "0912" */
  search?: string;
  shopId: string;
}
export interface ReadShopCustomerCardsInput {
  customerId: string;
  shopId: string;
}
export interface ReadShopManualCardChecksInput {
  /** @default 1 */
  page?: number;
  shopId: string;
}
export interface SubscriptionPlanModel {
  id: string;
  title: string;
  price: string;
  durationDays: number;
  isActive: boolean;
}
export interface CreateSubscriptionPlanInput {
  /** @example "اشتراک یک‌ماهه" */
  title: string;
  /**
   * Whole Tomans
   * @example 2000000
   */
  price: number;
  /** @example 30 */
  durationDays: number;
}
export interface SetSubscriptionPlanActiveInput {
  id: string;
  isActive: boolean;
}
export interface MySubscriptionModel {
  isActive: boolean;
  /** @format date-time */
  endsAt: string | null;
  currentPlanTitle: string | null;
}
export interface SubscriptionPurchaseModel {
  id: string;
  planTitle: string;
  price: string;
  durationDays: number;
  /** @format date-time */
  startsAt: string;
  /** @format date-time */
  endsAt: string;
  refId: string | null;
  /** @format date-time */
  createdAt: string;
}
export interface ReadSubscriptionPurchasesOutput {
  data: SubscriptionPurchaseModel[];
  count: number;
  pageSize: number;
}
export interface StartSubscriptionPurchaseInput {
  planId: string;
}
export interface SubscriptionPurchaseStartedModel {
  url: string;
}
export interface SetShopSubscriptionEndInput {
  shopId: string;
  /** @format date-time */
  endsAt: string;
}
export interface ReadTicketsInput {
  /** @default 1 */
  page?: number;
  status?: TicketStatus;
}
export interface TicketSummaryModel {
  id: string;
  title: string;
  status: TicketStatus;
  shopName: string;
  shopSubdomain: string;
  isNotice: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
}
export interface ReadTicketsOutput {
  data: TicketSummaryModel[];
  count: number;
  pageSize: number;
}
export interface SendNoticeInput {
  body: string;
  imageUrls?: string[];
  /** @example "مشکل در شارژ کیف پول" */
  title: string;
  smsText?: string;
}
export interface TicketNoticeModel {
  id: string;
  title: string;
  body: string;
  imageUrls: string[];
  shopCount: number;
  smsText: string | null;
  /** @format date-time */
  createdAt: string;
}
export interface ReadNoticesInput {
  /** @default 1 */
  page?: number;
}
export interface ReadNoticesOutput {
  data: TicketNoticeModel[];
  count: number;
  pageSize: number;
}
export interface TicketIdInput {
  ticketId: string;
}
export interface TicketMessageModel {
  id: string;
  fromAdmin: boolean;
  body: string;
  imageUrls: string[];
  /** @format date-time */
  createdAt: string;
}
export interface TicketModel {
  id: string;
  title: string;
  status: TicketStatus;
  shopName: string;
  shopSubdomain: string;
  isNotice: boolean;
  /** @format date-time */
  createdAt: string;
  /** @format date-time */
  updatedAt: string;
  messages: TicketMessageModel[];
}
export interface SendTicketMessageInput {
  body: string;
  imageUrls?: string[];
  ticketId: string;
}
export interface CreateTicketInput {
  body: string;
  imageUrls?: string[];
  /** @example "مشکل در شارژ کیف پول" */
  title: string;
}
export interface SubmitTobeShopInput {
  /** نام فروشگاه */
  name: string;
  /** نام برند */
  brandName: string;
  /**
   * setoode → setoode.zarimen.ir
   * @example "setoode"
   */
  subdomain: string;
  /** Public URL returned by createImageUpload */
  logoUrl?: string;
  address?: string;
  /** @example "02112345678" */
  landline?: string;
  ownerFullName: string;
  /** @example "09120000000" */
  ownerPhoneNumber: string;
  /** @example "0499370899" */
  ownerNationalCode: string;
}
export interface SubmitTobeShopOutput {
  accepted: boolean;
  subdomainTaken: boolean;
  nationalCodeTaken: boolean;
  phoneNumberTaken: boolean;
}
export interface CreateImageUploadInput {
  contentType: ImageContentType;
  size: number;
}
export interface CreateImageUploadOutput {
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
}
export interface ReadTobeShopsInput {
  /** @default 1 */
  page?: number;
  status?: TobeShopStatus;
}
export interface TobeShopModel {
  id: string;
  name: string;
  brandName: string;
  subdomain: string;
  logoUrl: string | null;
  address: string | null;
  landline: string | null;
  ownerFullName: string;
  ownerPhoneNumber: string;
  ownerNationalCode: string;
  status: TobeShopStatus;
  problem: string | null;
  shopId: string | null;
  /** @format date-time */
  smsSentAt: string | null;
  /** @format date-time */
  createdAt: string;
}
export interface ReadTobeShopsOutput {
  data: TobeShopModel[];
  count: number;
  pageSize: number;
}
export interface CheckAndInsertTobeShopInput {
  id: string;
  /**
   * Initial wallet balance in Tomans. Defaults to 0.
   * @example "1500000"
   */
  initialWalletBalance?: string;
}
export interface TobeShopIdInput {
  id: string;
}
export interface SendTobeShopSmsInput {
  id: string;
  value: string;
}
/** 1 paid, 0 not paid */
export declare enum PaymentCallbackInputStatusEnum {
  Value0 = 0,
  Value1 = 1,
}
export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;
export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}
export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;
export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}
export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}
type CancelToken = Symbol | string | number;
export declare enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}
export declare class HttpClient<SecurityDataType = unknown> {
  baseUrl: string;
  private securityData;
  private securityWorker?;
  private abortControllers;
  private customFetch;
  private baseApiParams;
  constructor(apiConfig?: ApiConfig<SecurityDataType>);
  setSecurityData: (data: SecurityDataType | null) => void;
  protected encodeQueryParam(key: string, value: any): string;
  protected addQueryParam(query: QueryParamsType, key: string): string;
  protected addArrayQueryParam(query: QueryParamsType, key: string): any;
  protected toQueryString(rawQuery?: QueryParamsType): string;
  protected addQueryParams(rawQuery?: QueryParamsType): string;
  private contentFormatters;
  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams;
  protected createAbortSignal: (
    cancelToken: CancelToken,
  ) => AbortSignal | undefined;
  abortRequest: (cancelToken: CancelToken) => void;
  request: <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams) => Promise<HttpResponse<T, E>>;
}
/**
 * @title Zar Imen APIs
 * @version 1.0
 * @contact
 */
export declare class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  setting: {
    /**
     * No description
     *
     * @tags Setting
     * @name ReadServiceCostSettings
     * @request POST:/setting/readServiceCostSettings
     * @secure
     */
    readServiceCostSettings: (
      params?: RequestParams,
    ) => Promise<HttpResponse<ServiceCostSettingsModel, any>>;
    /**
     * No description
     *
     * @tags Setting
     * @name SetServiceCostSettings
     * @request POST:/setting/setServiceCostSettings
     * @secure
     */
    setServiceCostSettings: (
      data: ServiceCostSettingsModel,
      params?: RequestParams,
    ) => Promise<HttpResponse<ServiceCostSettingsModel, any>>;
    /**
     * No description
     *
     * @tags Setting
     * @name ReadVatSettings
     * @request POST:/setting/readVatSettings
     * @secure
     */
    readVatSettings: (
      params?: RequestParams,
    ) => Promise<HttpResponse<VatSettingsModel, any>>;
    /**
     * No description
     *
     * @tags Setting
     * @name SetVatSettings
     * @request POST:/setting/setVatSettings
     * @secure
     */
    setVatSettings: (
      data: VatSettingsModel,
      params?: RequestParams,
    ) => Promise<HttpResponse<VatSettingsModel, any>>;
    /**
     * @description Public: what each Shahkar check, card check and SMS costs a shop.
     *
     * @tags PublicServiceCost
     * @name ReadPublicServiceCosts
     * @request POST:/setting/readPublicServiceCosts
     */
    readPublicServiceCosts: (
      params?: RequestParams,
    ) => Promise<HttpResponse<ServiceCostSettingsModel, any>>;
    /**
     * @description All plans, disabled included.
     *
     * @tags SubscriptionPlan
     * @name ReadSubscriptionPlans
     * @request POST:/setting/readSubscriptionPlans
     * @secure
     */
    readSubscriptionPlans: (
      params?: RequestParams,
    ) => Promise<HttpResponse<SubscriptionPlanModel[], any>>;
    /**
     * No description
     *
     * @tags SubscriptionPlan
     * @name CreateSubscriptionPlan
     * @request POST:/setting/createSubscriptionPlan
     * @secure
     */
    createSubscriptionPlan: (
      data: CreateSubscriptionPlanInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<SubscriptionPlanModel, any>>;
    /**
     * @description Disabled plans are no longer offered; past purchases keep them.
     *
     * @tags SubscriptionPlan
     * @name SetSubscriptionPlanActive
     * @request POST:/setting/setSubscriptionPlanActive
     * @secure
     */
    setSubscriptionPlanActive: (
      data: SetSubscriptionPlanActiveInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<SubscriptionPlanModel, any>>;
  };
  shopPanel: {
    /**
     * @description What each Shahkar check and SMS costs the owner's wallet.
     *
     * @tags ShopServiceCost
     * @name ReadServiceCosts
     * @request POST:/shop-panel/readServiceCosts
     * @secure
     */
    readServiceCosts: (
      params?: RequestParams,
    ) => Promise<HttpResponse<ServiceCostSettingsModel, any>>;
    /**
     * @description The VAT percent added to top-ups and subscription purchases (shown before paying).
     *
     * @tags ShopServiceCost
     * @name ReadVat
     * @request POST:/shop-panel/readVat
     * @secure
     */
    readVat: (
      params?: RequestParams,
    ) => Promise<HttpResponse<VatSettingsModel, any>>;
    /**
     * @description Returns the SePal url to add `amount` Tomans to the owner's wallet.
     *
     * @tags ShopWallet
     * @name StartWalletTopUp
     * @request POST:/shop-panel/startWalletTopUp
     * @secure
     */
    startWalletTopUp: (
      data: StartWalletTopUpInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<WalletTopUpModel, any>>;
    /**
     * No description
     *
     * @tags ShopWallet
     * @name ReadMyWalletTransactions
     * @request POST:/shop-panel/readMyWalletTransactions
     * @secure
     */
    readMyWalletTransactions: (
      data: ReadWalletTransactionsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadWalletTransactionsOutput, any>>;
    /**
     * @description Public: what the shop's landing and login pages show.
     *
     * @tags ShopPanel
     * @name ReadShopPublicInfo
     * @request POST:/shop-panel/readShopPublicInfo
     */
    readShopPublicInfo: (
      data: ReadShopPublicInfoInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopPublicInfoModel, any>>;
    /**
     * @description The logged-in owner's shop.
     *
     * @tags ShopPanel
     * @name ReadMyShop
     * @request POST:/shop-panel/readMyShop
     * @secure
     */
    readMyShop: (
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel, any>>;
    /**
     * @description Customers who verified at the owner's shop, optionally filtered by national code / mobile digits.
     *
     * @tags ShopCustomers
     * @name ReadMyCustomers
     * @request POST:/shop-panel/readMyCustomers
     * @secure
     */
    readMyCustomers: (
      data: ReadMyCustomersInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopCustomerModel[], any>>;
    /**
     * @description Full card numbers of one of the owner's customers.
     *
     * @tags ShopCustomers
     * @name ReadMyCustomerCards
     * @request POST:/shop-panel/readMyCustomerCards
     * @secure
     */
    readMyCustomerCards: (
      data: ReadMyCustomerCardsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopCustomerCardModel[], any>>;
    /**
     * @description Manual inquiry: CardMatch for a national code + birth date + card, paid from the shop's wallet. Kept in the shop's manual-check history.
     *
     * @tags ShopCustomers
     * @name CheckCardManually
     * @request POST:/shop-panel/checkCardManually
     * @secure
     */
    checkCardManually: (
      data: CheckCardManuallyInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ManualCardCheckModel, any>>;
    /**
     * @description The owner's «استعلام دستی» history, newest first.
     *
     * @tags ShopCustomers
     * @name ReadMyManualCardChecks
     * @request POST:/shop-panel/readMyManualCardChecks
     * @secure
     */
    readMyManualCardChecks: (
      data: ReadManualCardChecksInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadManualCardChecksOutput, any>>;
    /**
     * @description Plans the owner can buy.
     *
     * @tags ShopSubscription
     * @name ReadAvailablePlans
     * @request POST:/shop-panel/readAvailablePlans
     * @secure
     */
    readAvailablePlans: (
      params?: RequestParams,
    ) => Promise<HttpResponse<SubscriptionPlanModel[], any>>;
    /**
     * No description
     *
     * @tags ShopSubscription
     * @name ReadMySubscription
     * @request POST:/shop-panel/readMySubscription
     * @secure
     */
    readMySubscription: (
      params?: RequestParams,
    ) => Promise<HttpResponse<MySubscriptionModel, any>>;
    /**
     * No description
     *
     * @tags ShopSubscription
     * @name ReadMySubscriptionPurchases
     * @request POST:/shop-panel/readMySubscriptionPurchases
     * @secure
     */
    readMySubscriptionPurchases: (
      data: ReadWalletTransactionsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadSubscriptionPurchasesOutput, any>>;
    /**
     * @description Returns the SePal url to pay for the plan.
     *
     * @tags ShopSubscription
     * @name StartSubscriptionPurchase
     * @request POST:/shop-panel/startSubscriptionPurchase
     * @secure
     */
    startSubscriptionPurchase: (
      data: StartSubscriptionPurchaseInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<SubscriptionPurchaseStartedModel, any>>;
    /**
     * @description Opens a PENDING ticket with its first message and texts the admins.
     *
     * @tags ShopTicket
     * @name CreateTicket
     * @request POST:/shop-panel/createTicket
     * @secure
     */
    createTicket: (
      data: CreateTicketInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketModel, any>>;
    /**
     * No description
     *
     * @tags ShopTicket
     * @name ReadMyTickets
     * @request POST:/shop-panel/readMyTickets
     * @secure
     */
    readMyTickets: (
      data: ReadTicketsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadTicketsOutput, any>>;
    /**
     * No description
     *
     * @tags ShopTicket
     * @name ReadMyTicket
     * @request POST:/shop-panel/readMyTicket
     * @secure
     */
    readMyTicket: (
      data: TicketIdInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketModel, any>>;
    /**
     * @description Owner message; the ticket goes back to PENDING and the admins get an SMS.
     *
     * @tags ShopTicket
     * @name SendMyTicketMessage
     * @request POST:/shop-panel/sendMyTicketMessage
     * @secure
     */
    sendMyTicketMessage: (
      data: SendTicketMessageInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketModel, any>>;
    /**
     * @description Only the owner closes; no one can write afterwards.
     *
     * @tags ShopTicket
     * @name CloseMyTicket
     * @request POST:/shop-panel/closeMyTicket
     * @secure
     */
    closeMyTicket: (
      data: TicketIdInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketModel, any>>;
    /**
     * No description
     *
     * @tags ShopImageUpload
     * @name CreateMyImageUpload
     * @request POST:/shop-panel/createMyImageUpload
     * @secure
     */
    createMyImageUpload: (
      data: CreateImageUploadInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<CreateImageUploadOutput, any>>;
  };
  wallet: {
    /**
     * @description Verifies the top-up, credits the wallet, then 302s to <shopSiteUrl>/panel/wallet?topUp=success&amount=&refId= or ?topUp=failed&reason=
     *
     * @tags WalletCallback
     * @name WalletTopUpCallback
     * @request POST:/wallet/topUpCallback
     */
    walletTopUpCallback: (
      data: PaymentCallbackInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<any, void>>;
  };
  shop: {
    /**
     * No description
     *
     * @tags AdminShopWallet
     * @name ReadShopWalletTransactions
     * @request POST:/shop/readShopWalletTransactions
     * @secure
     */
    readShopWalletTransactions: (
      data: ReadShopWalletTransactionsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadWalletTransactionsOutput, any>>;
    /**
     * No description
     *
     * @tags Shop
     * @name CreateShop
     * @request POST:/shop/createShop
     * @secure
     */
    createShop: (
      data: CreateShopInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel, any>>;
    /**
     * @description Edits a shop's details; the subdomain and the owner's mobile and national code cannot change.
     *
     * @tags Shop
     * @name UpdateShop
     * @request POST:/shop/updateShop
     * @secure
     */
    updateShop: (
      data: UpdateShopInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel, any>>;
    /**
     * No description
     *
     * @tags Shop
     * @name ReadShops
     * @request POST:/shop/readShops
     * @secure
     */
    readShops: (
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel[], any>>;
    /**
     * No description
     *
     * @tags Shop
     * @name SetShopActive
     * @request POST:/shop/setShopActive
     * @secure
     */
    setShopActive: (
      data: SetShopActiveInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel, any>>;
    /**
     * @description Sets the shop's wallet balance to the given amount.
     *
     * @tags Shop
     * @name SetWalletBalance
     * @request POST:/shop/setWalletBalance
     * @secure
     */
    setWalletBalance: (
      data: SetWalletBalanceInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel, any>>;
    /**
     * @description One shop, for the admin's view of its panel.
     *
     * @tags Shop
     * @name ReadShopBySubdomain
     * @request POST:/shop/readShopBySubdomain
     * @secure
     */
    readShopBySubdomain: (
      data: ReadShopPublicInfoInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopModel, any>>;
    /**
     * No description
     *
     * @tags AdminShopCustomers
     * @name ReadShopCustomers
     * @request POST:/shop/readShopCustomers
     * @secure
     */
    readShopCustomers: (
      data: ReadShopCustomersInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopCustomerModel[], any>>;
    /**
     * No description
     *
     * @tags AdminShopCustomers
     * @name ReadShopCustomerCards
     * @request POST:/shop/readShopCustomerCards
     * @secure
     */
    readShopCustomerCards: (
      data: ReadShopCustomerCardsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopCustomerCardModel[], any>>;
    /**
     * @description A shop owner's «استعلام دستی» history, newest first.
     *
     * @tags AdminShopCustomers
     * @name ReadShopManualCardChecks
     * @request POST:/shop/readShopManualCardChecks
     * @secure
     */
    readShopManualCardChecks: (
      data: ReadShopManualCardChecksInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadManualCardChecksOutput, any>>;
    /**
     * @description Moves the shop's subscription end later (never earlier than the current end or now).
     *
     * @tags AdminShopSubscription
     * @name SetShopSubscriptionEnd
     * @request POST:/shop/setShopSubscriptionEnd
     * @secure
     */
    setShopSubscriptionEnd: (
      data: SetShopSubscriptionEndInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<MySubscriptionModel, any>>;
  };
  auth: {
    /**
     * @description Sends a login code to the admin's phone. Finish with `exchangeAdminOtp`.
     *
     * @tags Auth
     * @name SendAdminOtp
     * @request POST:/auth/sendAdminOtp
     */
    sendAdminOtp: (
      data: SendOtpInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<OtpSentModel, any>>;
    /**
     * No description
     *
     * @tags Auth
     * @name ExchangeAdminOtp
     * @request POST:/auth/exchangeAdminOtp
     */
    exchangeAdminOtp: (
      data: ExchangeOtpInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TokenModel, any>>;
    /**
     * No description
     *
     * @tags Auth
     * @name Me
     * @request POST:/auth/me
     * @secure
     */
    me: (params?: RequestParams) => Promise<HttpResponse<MeModel, any>>;
    /**
     * @description Sends a login code to the owner of the shop on `subdomain`. Finish with `exchangeShopOtp`.
     *
     * @tags Auth
     * @name SendShopOtp
     * @request POST:/auth/sendShopOtp
     */
    sendShopOtp: (
      data: SendShopOtpInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<OtpSentModel, any>>;
    /**
     * No description
     *
     * @tags Auth
     * @name ExchangeShopOtp
     * @request POST:/auth/exchangeShopOtp
     */
    exchangeShopOtp: (
      data: ExchangeShopOtpInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TokenModel, any>>;
  };
  customer: {
    /**
     * @description Phase 1: Shahkar check, then an SMS code. Finish with completeSignup.
     *
     * @tags Customer
     * @name StartSignup
     * @request POST:/customer/startSignup
     */
    startSignup: (
      data: StartSignupInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<SignupStartedModel, any>>;
    /**
     * @description Phase 2: the SMS code saves the customer and opens a session.
     *
     * @tags Customer
     * @name CompleteSignup
     * @request POST:/customer/completeSignup
     */
    completeSignup: (
      data: CompleteSignupInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<CustomerTokenModel, any>>;
    /**
     * @description Returning customer: SMS code to a registered phone. Finish with completeLogin.
     *
     * @tags Customer
     * @name StartLogin
     * @request POST:/customer/startLogin
     */
    startLogin: (
      data: StartLoginInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<OtpSentModel, any>>;
    /**
     * No description
     *
     * @tags Customer
     * @name CompleteLogin
     * @request POST:/customer/completeLogin
     */
    completeLogin: (
      data: CompleteLoginInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<CustomerTokenModel, any>>;
    /**
     * @description Phase 3: the customer's verified cards.
     *
     * @tags Customer
     * @name ReadMyCards
     * @request POST:/customer/readMyCards
     * @secure
     */
    readMyCards: (
      params?: RequestParams,
    ) => Promise<HttpResponse<CustomerCardsModel, any>>;
    /**
     * @description Phase 3: CardMatch check, then the card is saved.
     *
     * @tags Customer
     * @name AddCard
     * @request POST:/customer/addCard
     * @secure
     */
    addCard: (
      data: AddCardInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<CustomerCardsModel, any>>;
  };
  subscription: {
    /**
     * @description Public: the active plans, for the zarimen.ir landing page.
     *
     * @tags SubscriptionCallback
     * @name ReadPublicPlans
     * @request POST:/subscription/readPublicPlans
     */
    readPublicPlans: (
      params?: RequestParams,
    ) => Promise<HttpResponse<SubscriptionPlanModel[], any>>;
    /**
     * @description Verifies the payment, extends the subscription, then 302s to <shopSiteUrl>/panel/subscription?purchase=success&plan=&endsAt=&refId= or ?purchase=failed&reason=
     *
     * @tags SubscriptionCallback
     * @name SubscriptionPurchaseCallback
     * @request POST:/subscription/purchaseCallback
     */
    subscriptionPurchaseCallback: (
      data: PaymentCallbackInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<any, void>>;
  };
  ticket: {
    /**
     * @description All shops' tickets, latest activity first, optionally one status only. Notice copies are left out (see readNotices).
     *
     * @tags Ticket
     * @name ReadTickets
     * @request POST:/ticket/readTickets
     * @secure
     */
    readTickets: (
      data: ReadTicketsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadTicketsOutput, any>>;
    /**
     * @description A CLOSED ticket with this message to every enabled shop; `smsText` is texted to their owners.
     *
     * @tags Ticket
     * @name SendNotice
     * @request POST:/ticket/sendNotice
     * @secure
     */
    sendNotice: (
      data: SendNoticeInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketNoticeModel, any>>;
    /**
     * @description The admins' notices, newest first.
     *
     * @tags Ticket
     * @name ReadNotices
     * @request POST:/ticket/readNotices
     * @secure
     */
    readNotices: (
      data: ReadNoticesInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadNoticesOutput, any>>;
    /**
     * No description
     *
     * @tags Ticket
     * @name ReadTicket
     * @request POST:/ticket/readTicket
     * @secure
     */
    readTicket: (
      data: TicketIdInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketModel, any>>;
    /**
     * @description Admin reply; the ticket becomes ANSWERED. Refused once the owner closed it.
     *
     * @tags Ticket
     * @name AnswerTicket
     * @request POST:/ticket/answerTicket
     * @secure
     */
    answerTicket: (
      data: SendTicketMessageInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TicketModel, any>>;
  };
  tobeShop: {
    /**
     * @description Saved (and the admins texted) only when no existing shop has the subdomain, national code or mobile.
     *
     * @tags PublicTobeShop
     * @name SubmitTobeShop
     * @request POST:/tobe-shop/submitTobeShop
     */
    submitTobeShop: (
      data: SubmitTobeShopInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<SubmitTobeShopOutput, any>>;
    /**
     * @description Presigned upload for the form's logo, limited per IP.
     *
     * @tags PublicTobeShop
     * @name CreateTobeShopLogoUpload
     * @request POST:/tobe-shop/createTobeShopLogoUpload
     */
    createTobeShopLogoUpload: (
      data: CreateImageUploadInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<CreateImageUploadOutput, any>>;
    /**
     * @description Newest first, optionally one status only.
     *
     * @tags TobeShop
     * @name ReadTobeShops
     * @request POST:/tobe-shop/readTobeShops
     * @secure
     */
    readTobeShops: (
      data: ReadTobeShopsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ReadTobeShopsOutput, any>>;
    /**
     * @description Runs the shop checks (Shahkar included): REGISTERED with a new Shop, or CANCELED with `problem`.
     *
     * @tags TobeShop
     * @name CheckAndInsertTobeShop
     * @request POST:/tobe-shop/checkAndInsertTobeShop
     * @secure
     */
    checkAndInsertTobeShop: (
      data: CheckAndInsertTobeShopInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TobeShopModel, any>>;
    /**
     * No description
     *
     * @tags TobeShop
     * @name CancelTobeShop
     * @request POST:/tobe-shop/cancelTobeShop
     * @secure
     */
    cancelTobeShop: (
      data: TobeShopIdInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TobeShopModel, any>>;
    /**
     * @description CANCELED → rejection template (value = INFO); REGISTERED → welcome template (value = SUBDOMAIN). Once per request.
     *
     * @tags TobeShop
     * @name SendTobeShopSms
     * @request POST:/tobe-shop/sendTobeShopSms
     * @secure
     */
    sendTobeShopSms: (
      data: SendTobeShopSmsInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<TobeShopModel, any>>;
  };
  imageUpload: {
    /**
     * No description
     *
     * @tags ImageUpload
     * @name CreateImageUpload
     * @request POST:/image-upload/createImageUpload
     * @secure
     */
    createImageUpload: (
      data: CreateImageUploadInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<CreateImageUploadOutput, any>>;
  };
}
export {};
