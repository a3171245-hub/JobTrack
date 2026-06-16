/**
 * Cloudflare Email Routing Worker
 *
 * 設定方法:
 *   wrangler.toml の [vars] に JOBTRACK_API_URL を設定
 *   wrangler secret put JOBTRACK_API_SECRET で秘密キーを設定
 *
 * 必要な環境変数:
 *   JOBTRACK_API_URL    - Next.jsアプリのURL (例: https://jobtrack.vercel.app)
 *   JOBTRACK_API_SECRET - /api/email/inbound の認証シークレット
 */

// Maximum raw email size accepted (bytes). Larger emails are silently discarded.
const MAX_EMAIL_BYTES = 100_000 // 100 KB

/** Basic email address format check */
function isValidEmail(addr) {
  return (
    typeof addr === 'string' &&
    addr.length > 0 &&
    addr.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)
  )
}

export default {
  async email(message, env, ctx) {
    // ── Sender validation ────────────────────────────────────────────
    if (!isValidEmail(message.from)) {
      console.warn('[email-handler] invalid sender address, discarding:', message.from)
      return // silently discard (not throw — Cloudflare would retry on throw)
    }

    // ── Size guard ───────────────────────────────────────────────────
    // Read raw RFC 2822 email
    const rawEmail = await new Response(message.raw).text()

    if (rawEmail.length > MAX_EMAIL_BYTES) {
      console.warn(
        `[email-handler] email too large (${rawEmail.length} bytes), discarding from: ${message.from}`
      )
      return
    }

    // ── Parse ────────────────────────────────────────────────────────
    // Split headers from body on the first blank line
    const sepIdx = rawEmail.indexOf('\r\n\r\n')
    const headersText = sepIdx !== -1 ? rawEmail.slice(0, sepIdx) : rawEmail
    const rawBody = sepIdx !== -1 ? rawEmail.slice(sepIdx + 4) : ''

    // Unfold RFC 2822 folded header lines, then extract Subject
    const unfoldedHeaders = headersText.replace(/\r?\n[ \t]+/g, ' ')
    const subjectMatch = unfoldedHeaders.match(/^Subject:\s*(.+)$/im)
    const subject = subjectMatch ? subjectMatch[1].trim() : '(件名なし)'

    // Decode MIME-encoded subject (=?UTF-8?B?...?= or =?UTF-8?Q?...?=)
    const decodedSubject = decodeMimeWords(subject)

    // Extract plain-text body (handles text/plain and basic multipart)
    const bodyText = extractPlainText(rawBody, headersText)

    const payload = {
      to: message.to,
      from: message.from,
      subject: decodedSubject,
      body: bodyText.slice(0, 20000),
    }

    const response = await fetch(
      `${env.JOBTRACK_API_URL}/api/email/inbound`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.JOBTRACK_API_SECRET}`,
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(
        `JobTrack API error ${response.status}: ${text.slice(0, 200)}`
      )
    }
  },
}

/**
 * Decode RFC 2047 encoded-words (=?charset?encoding?text?=)
 * Handles UTF-8 Base64 and Quoted-Printable encoded subjects.
 */
function decodeMimeWords(str) {
  return str.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const bytes = atob(text)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        return new TextDecoder(charset).decode(arr)
      } else {
        // Quoted-Printable
        const qpDecoded = text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (__, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
        return qpDecoded
      }
    } catch {
      return text
    }
  })
}

/**
 * Extract plain-text content from a MIME body.
 * Handles text/plain, text/html (strip tags), and multipart/alternative.
 */
function extractPlainText(body, headersText) {
  const contentTypeMatch = headersText.match(/^Content-Type:\s*([^\r\n;]+)/im)
  const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : 'text/plain'

  if (contentType.startsWith('multipart/')) {
    const boundaryMatch = headersText.match(/boundary="?([^"\r\n;]+)"?/i)
    if (!boundaryMatch) return stripHtml(body)

    const boundary = boundaryMatch[1].trim()
    const parts = body.split(new RegExp(`--${escapeRegex(boundary)}(?:--)?`))

    // Prefer text/plain part; fall back to text/html
    let plainPart = ''
    let htmlPart = ''

    for (const part of parts) {
      const partSep = part.indexOf('\r\n\r\n')
      if (partSep === -1) continue
      const partHeaders = part.slice(0, partSep)
      const partBody = part.slice(partSep + 4)
      const partCT = (partHeaders.match(/^Content-Type:\s*([^\r\n;]+)/im) || [])[1] || ''

      if (partCT.toLowerCase().includes('text/plain') && !plainPart) {
        plainPart = decodeTransferEncoding(partBody, partHeaders)
      } else if (partCT.toLowerCase().includes('text/html') && !htmlPart) {
        htmlPart = decodeTransferEncoding(partBody, partHeaders)
      }
    }

    if (plainPart) return plainPart.trim()
    if (htmlPart) return stripHtml(htmlPart).trim()
    return body.trim()
  }

  if (contentType.startsWith('text/html')) {
    return stripHtml(decodeTransferEncoding(body, headersText)).trim()
  }

  return decodeTransferEncoding(body, headersText).trim()
}

function decodeTransferEncoding(body, headersText) {
  const encodingMatch = headersText.match(/^Content-Transfer-Encoding:\s*(\S+)/im)
  const encoding = encodingMatch ? encodingMatch[1].trim().toLowerCase() : '7bit'

  if (encoding === 'base64') {
    try {
      const cleaned = body.replace(/\s/g, '')
      const bytes = atob(cleaned)
      const arr = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
      return new TextDecoder('utf-8').decode(arr)
    } catch {
      return body
    }
  }

  if (encoding === 'quoted-printable') {
    return body
      .replace(/=\r?\n/g, '')
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  }

  return body
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\r?\n{3,}/g, '\n\n')
    .trim()
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
