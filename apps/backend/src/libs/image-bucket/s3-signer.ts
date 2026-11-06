import { createHash, createHmac } from "node:crypto"

/**
 * AWS Signature Version 4 for presigned PUT URLs the panel uploads images through
 * (copied from Darik). Hand-written to avoid the AWS SDK for one kind of request;
 * a mistake here shows up as a 403, not silently.
 */

export type S3Credentials = {
	accessKey: string
	secretKey: string
	region: string
}

/** Objects are private on upload even in a public bucket, and the site loads them with no credentials. */
const PUBLIC_READ = "public-read"

const sha256 = (data: string) => createHash("sha256").update(data).digest("hex")

/** RFC 3986 encoding, which SigV4 requires; `encodeURIComponent` leaves `!'()*` alone. */
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

function timestamps(now: Date) {
	const stamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
	return { stamp, date: stamp.slice(0, 8) }
}

function signature(credentials: S3Credentials, date: string, stringToSign: string) {
	let key = createHmac("sha256", `AWS4${credentials.secretKey}`).update(date).digest()
	for (const part of [credentials.region, "s3", "aws4_request"])
		key = createHmac("sha256", key).update(part).digest()
	return createHmac("sha256", key).update(stringToSign).digest("hex")
}

function canonicalHeaders(headers: Record<string, string>) {
	const names = Object.keys(headers).sort()
	return {
		block: names.map(name => `${name}:${headers[name]}\n`).join(""),
		signed: names.join(";"),
	}
}

/**
 * Query-string SigV4 signature for `method` on `url`. `headers` are the ones
 * the request must carry (besides `host`, which is always signed).
 */
export function presignUrl(
	method: string,
	url: string,
	headers: Record<string, string>,
	credentials: S3Credentials,
	expiresInSeconds: number,
	now = new Date(),
): string {
	const { host, pathname } = new URL(url)
	const { stamp, date } = timestamps(now)
	const scope = `${date}/${credentials.region}/s3/aws4_request`
	const { block, signed } = canonicalHeaders({ ...headers, host })

	const query: Record<string, string> = {
		"X-Amz-Algorithm": "AWS4-HMAC-SHA256",
		"X-Amz-Credential": `${credentials.accessKey}/${scope}`,
		"X-Amz-Date": stamp,
		"X-Amz-Expires": String(expiresInSeconds),
		"X-Amz-SignedHeaders": signed,
	}
	const canonicalQuery = Object.entries(query).sort(([a], [b]) => (a < b ? -1 : 1)).map(([key, value]) => `${encode(key)}=${encode(value)}`).join("&")

	const canonicalRequest = [method, pathname, canonicalQuery, block, signed, "UNSIGNED-PAYLOAD"].join("\n")
	const stringToSign = ["AWS4-HMAC-SHA256", stamp, scope, sha256(canonicalRequest)].join("\n")

	return `${url.split("?")[0]}?${canonicalQuery}&X-Amz-Signature=${signature(credentials, date, stringToSign)}`
}

export type PresignedPut = {
	/** Signed URL the browser PUTs the file to; valid for `expiresInSeconds`. */
	uploadUrl: string
	/** Headers the PUT must carry with exactly these values, or ArvanCloud answers 403. */
	headers: Record<string, string>
}

/**
 * Presigns a PUT of one public-read object. Type and size are part of the
 * signature, so the URL only accepts a file of that type and exactly that many bytes.
 */
export function presignPublicPut(
	url: string,
	file: { contentType: string, size: number },
	credentials: S3Credentials,
	expiresInSeconds: number,
): PresignedPut {
	const headers = { "content-type": file.contentType, "x-amz-acl": PUBLIC_READ }
	// The browser sets Content-Length itself from the file, so it is signed but not handed back.
	const uploadUrl = presignUrl("PUT", url, { ...headers, "content-length": String(file.size) }, credentials, expiresInSeconds)
	return { uploadUrl, headers }
}
