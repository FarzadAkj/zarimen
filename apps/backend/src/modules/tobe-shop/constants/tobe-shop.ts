export const TOBE_SHOPS_PAGE_SIZE = 20

/** Per IP per hour: submissions the admins are texted about, all submissions, logo uploads. */
export const ACCEPTED_PER_HOUR = 3
export const ATTEMPTS_PER_HOUR = 20
export const UPLOADS_PER_HOUR = 10

/** What the admins get by SMS for every new request. */
export function tobeShopNotice(request: { name: string, subdomain: string }) {
	return `درخواست ثبت فروشگاه ${request.name} (${request.subdomain}) ارسال شده است.`
}

/** "Check and Insert" failures the requester can fix, as the SMS's INFO text. Others are thrown. */
export function problemText(code: string, request: { subdomain: string, ownerNationalCode: string, ownerPhoneNumber: string }): string | null {
	switch (code) {
		case "PhoneNationalCodeMismatch": return `کد ملی صاحب (${request.ownerNationalCode}) با شماره تلفن (${request.ownerPhoneNumber}) مطابقت ندارد`
		case "SubdomainTaken": return `زیردامنه ${request.subdomain} قبلاً برای فروشگاه دیگری ثبت شده است`
		case "NationalCodeTaken": return `کد ملی ${request.ownerNationalCode} قبلاً برای فروشگاه دیگری ثبت شده است`
		case "PhoneNumberTaken": return `شماره موبایل ${request.ownerPhoneNumber} قبلاً برای فروشگاه دیگری ثبت شده است`
		default: return null
	}
}
