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

export declare enum ImageContentType {
  ImageJpeg = "image/jpeg",
  ImagePng = "image/png",
  ImageWebp = "image/webp",
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
export interface SetShopActiveInput {
  id: string;
  isActive: boolean;
}
export interface SetWalletBalanceInput {
  shopId: string;
  /** @example "1500000" */
  balance: string;
}
export interface ReadShopLoginInfoInput {
  /** @example "setoode" */
  subdomain: string;
}
export interface ShopLoginInfoModel {
  name: string;
  brandName: string;
  logoUrl: string | null;
  isActive: boolean;
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
  shop: {
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
  };
  shopPanel: {
    /**
     * @description Public: name and logo shown on the shop's login page.
     *
     * @tags ShopPanel
     * @name ReadShopLoginInfo
     * @request POST:/shop-panel/readShopLoginInfo
     */
    readShopLoginInfo: (
      data: ReadShopLoginInfoInput,
      params?: RequestParams,
    ) => Promise<HttpResponse<ShopLoginInfoModel, any>>;
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
