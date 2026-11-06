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

export var ImageContentType;
(function (ImageContentType) {
  ImageContentType["ImageJpeg"] = "image/jpeg";
  ImageContentType["ImagePng"] = "image/png";
  ImageContentType["ImageWebp"] = "image/webp";
})(ImageContentType || (ImageContentType = {}));
export var PaidService;
(function (PaidService) {
  PaidService["SHAHKAR"] = "SHAHKAR";
  PaidService["SMS"] = "SMS";
})(PaidService || (PaidService = {}));
export var WalletTransactionType;
(function (WalletTransactionType) {
  WalletTransactionType["TOP_UP"] = "TOP_UP";
  WalletTransactionType["SERVICE_CHARGE"] = "SERVICE_CHARGE";
  WalletTransactionType["ADMIN_ADJUSTMENT"] = "ADMIN_ADJUSTMENT";
})(WalletTransactionType || (WalletTransactionType = {}));
export var WalletTopUpCallbackParamsStatusEnum;
(function (WalletTopUpCallbackParamsStatusEnum) {
  WalletTopUpCallbackParamsStatusEnum["OK"] = "OK";
  WalletTopUpCallbackParamsStatusEnum["NOK"] = "NOK";
})(
  WalletTopUpCallbackParamsStatusEnum ||
    (WalletTopUpCallbackParamsStatusEnum = {}),
);
export var ContentType;
(function (ContentType) {
  ContentType["Json"] = "application/json";
  ContentType["JsonApi"] = "application/vnd.api+json";
  ContentType["FormData"] = "multipart/form-data";
  ContentType["UrlEncoded"] = "application/x-www-form-urlencoded";
  ContentType["Text"] = "text/plain";
})(ContentType || (ContentType = {}));
export class HttpClient {
  baseUrl = "";
  securityData = null;
  securityWorker;
  abortControllers = new Map();
  customFetch = (...fetchParams) => fetch(...fetchParams);
  baseApiParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };
  constructor(apiConfig = {}) {
    Object.assign(this, apiConfig);
  }
  setSecurityData = (data) => {
    this.securityData = data;
  };
  encodeQueryParam(key, value) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }
  addQueryParam(query, key) {
    return this.encodeQueryParam(key, query[key]);
  }
  addArrayQueryParam(query, key) {
    const value = query[key];
    return value.map((v) => this.encodeQueryParam(key, v)).join("&");
  }
  toQueryString(rawQuery) {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }
  addQueryParams(rawQuery) {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }
  contentFormatters = {
    [ContentType.Json]: (input) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input) => {
      if (input instanceof FormData) {
        return input;
      }
      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input) => this.toQueryString(input),
  };
  mergeRequestParams(params1, params2) {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }
  createAbortSignal = (cancelToken) => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }
    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };
  abortRequest = (cancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };
  request = async ({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }) => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;
    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response;
      r.data = null;
      r.error = null;
      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });
      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }
      if (!response.ok) throw data;
      return data;
    });
  };
}
/**
 * @title Zar Imen APIs
 * @version 1.0
 * @contact
 */
export class Api extends HttpClient {
  setting = {
    /**
     * No description
     *
     * @tags Setting
     * @name ReadServiceCostSettings
     * @request POST:/setting/readServiceCostSettings
     * @secure
     */
    readServiceCostSettings: (params = {}) =>
      this.request({
        path: `/setting/readServiceCostSettings`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Setting
     * @name SetServiceCostSettings
     * @request POST:/setting/setServiceCostSettings
     * @secure
     */
    setServiceCostSettings: (data, params = {}) =>
      this.request({
        path: `/setting/setServiceCostSettings`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  wallet = {
    /**
     * @description Verifies the top-up, credits the wallet, then 302s to <shopSiteUrl>/panel/wallet?topUp=success&amount=&refId= or ?topUp=failed&reason=
     *
     * @tags WalletCallback
     * @name WalletTopUpCallback
     * @request GET:/wallet/topUpCallback
     */
    walletTopUpCallback: (query, params = {}) =>
      this.request({
        path: `/wallet/topUpCallback`,
        method: "GET",
        query: query,
        ...params,
      }),
  };
  shopPanel = {
    /**
     * @description Returns the Zarinpal url to add `amount` Tomans to the owner's wallet.
     *
     * @tags ShopWallet
     * @name StartWalletTopUp
     * @request POST:/shop-panel/startWalletTopUp
     * @secure
     */
    startWalletTopUp: (data, params = {}) =>
      this.request({
        path: `/shop-panel/startWalletTopUp`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags ShopWallet
     * @name ReadMyWalletTransactions
     * @request POST:/shop-panel/readMyWalletTransactions
     * @secure
     */
    readMyWalletTransactions: (data, params = {}) =>
      this.request({
        path: `/shop-panel/readMyWalletTransactions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description Public: what the shop's landing and login pages show.
     *
     * @tags ShopPanel
     * @name ReadShopPublicInfo
     * @request POST:/shop-panel/readShopPublicInfo
     */
    readShopPublicInfo: (data, params = {}) =>
      this.request({
        path: `/shop-panel/readShopPublicInfo`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description The logged-in owner's shop.
     *
     * @tags ShopPanel
     * @name ReadMyShop
     * @request POST:/shop-panel/readMyShop
     * @secure
     */
    readMyShop: (params = {}) =>
      this.request({
        path: `/shop-panel/readMyShop`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
    /**
     * @description Customers who verified at the owner's shop, optionally filtered by national code / mobile digits.
     *
     * @tags ShopCustomers
     * @name ReadMyCustomers
     * @request POST:/shop-panel/readMyCustomers
     * @secure
     */
    readMyCustomers: (data, params = {}) =>
      this.request({
        path: `/shop-panel/readMyCustomers`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description Full card numbers of one of the owner's customers.
     *
     * @tags ShopCustomers
     * @name ReadMyCustomerCards
     * @request POST:/shop-panel/readMyCustomerCards
     * @secure
     */
    readMyCustomerCards: (data, params = {}) =>
      this.request({
        path: `/shop-panel/readMyCustomerCards`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  shop = {
    /**
     * No description
     *
     * @tags AdminShopWallet
     * @name ReadShopWalletTransactions
     * @request POST:/shop/readShopWalletTransactions
     * @secure
     */
    readShopWalletTransactions: (data, params = {}) =>
      this.request({
        path: `/shop/readShopWalletTransactions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Shop
     * @name CreateShop
     * @request POST:/shop/createShop
     * @secure
     */
    createShop: (data, params = {}) =>
      this.request({
        path: `/shop/createShop`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Shop
     * @name ReadShops
     * @request POST:/shop/readShops
     * @secure
     */
    readShops: (params = {}) =>
      this.request({
        path: `/shop/readShops`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Shop
     * @name SetShopActive
     * @request POST:/shop/setShopActive
     * @secure
     */
    setShopActive: (data, params = {}) =>
      this.request({
        path: `/shop/setShopActive`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description Sets the shop's wallet balance to the given amount.
     *
     * @tags Shop
     * @name SetWalletBalance
     * @request POST:/shop/setWalletBalance
     * @secure
     */
    setWalletBalance: (data, params = {}) =>
      this.request({
        path: `/shop/setWalletBalance`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description One shop, for the admin's view of its panel.
     *
     * @tags Shop
     * @name ReadShopBySubdomain
     * @request POST:/shop/readShopBySubdomain
     * @secure
     */
    readShopBySubdomain: (data, params = {}) =>
      this.request({
        path: `/shop/readShopBySubdomain`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags AdminShopCustomers
     * @name ReadShopCustomers
     * @request POST:/shop/readShopCustomers
     * @secure
     */
    readShopCustomers: (data, params = {}) =>
      this.request({
        path: `/shop/readShopCustomers`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags AdminShopCustomers
     * @name ReadShopCustomerCards
     * @request POST:/shop/readShopCustomerCards
     * @secure
     */
    readShopCustomerCards: (data, params = {}) =>
      this.request({
        path: `/shop/readShopCustomerCards`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  auth = {
    /**
     * @description Sends a login code to the admin's phone. Finish with `exchangeAdminOtp`.
     *
     * @tags Auth
     * @name SendAdminOtp
     * @request POST:/auth/sendAdminOtp
     */
    sendAdminOtp: (data, params = {}) =>
      this.request({
        path: `/auth/sendAdminOtp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Auth
     * @name ExchangeAdminOtp
     * @request POST:/auth/exchangeAdminOtp
     */
    exchangeAdminOtp: (data, params = {}) =>
      this.request({
        path: `/auth/exchangeAdminOtp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Auth
     * @name Me
     * @request POST:/auth/me
     * @secure
     */
    me: (params = {}) =>
      this.request({
        path: `/auth/me`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
    /**
     * @description Sends a login code to the owner of the shop on `subdomain`. Finish with `exchangeShopOtp`.
     *
     * @tags Auth
     * @name SendShopOtp
     * @request POST:/auth/sendShopOtp
     */
    sendShopOtp: (data, params = {}) =>
      this.request({
        path: `/auth/sendShopOtp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Auth
     * @name ExchangeShopOtp
     * @request POST:/auth/exchangeShopOtp
     */
    exchangeShopOtp: (data, params = {}) =>
      this.request({
        path: `/auth/exchangeShopOtp`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  customer = {
    /**
     * @description Phase 1: Shahkar check, then an SMS code. Finish with completeSignup.
     *
     * @tags Customer
     * @name StartSignup
     * @request POST:/customer/startSignup
     */
    startSignup: (data, params = {}) =>
      this.request({
        path: `/customer/startSignup`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description Phase 2: the SMS code saves the customer and opens a session.
     *
     * @tags Customer
     * @name CompleteSignup
     * @request POST:/customer/completeSignup
     */
    completeSignup: (data, params = {}) =>
      this.request({
        path: `/customer/completeSignup`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description Returning customer: SMS code to a registered phone. Finish with completeLogin.
     *
     * @tags Customer
     * @name StartLogin
     * @request POST:/customer/startLogin
     */
    startLogin: (data, params = {}) =>
      this.request({
        path: `/customer/startLogin`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * No description
     *
     * @tags Customer
     * @name CompleteLogin
     * @request POST:/customer/completeLogin
     */
    completeLogin: (data, params = {}) =>
      this.request({
        path: `/customer/completeLogin`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
    /**
     * @description Phase 3: the customer's verified cards.
     *
     * @tags Customer
     * @name ReadMyCards
     * @request POST:/customer/readMyCards
     * @secure
     */
    readMyCards: (params = {}) =>
      this.request({
        path: `/customer/readMyCards`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
    /**
     * @description Phase 3: CardMatch check, then the card is saved.
     *
     * @tags Customer
     * @name AddCard
     * @request POST:/customer/addCard
     * @secure
     */
    addCard: (data, params = {}) =>
      this.request({
        path: `/customer/addCard`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  imageUpload = {
    /**
     * No description
     *
     * @tags ImageUpload
     * @name CreateImageUpload
     * @request POST:/image-upload/createImageUpload
     * @secure
     */
    createImageUpload: (data, params = {}) =>
      this.request({
        path: `/image-upload/createImageUpload`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
