import { BRAND } from "../data/brand.ts";

/**
 * A table-based HTML email.
 *
 * Email clients are not browsers: Outlook renders with Word, Gmail strips
 * <style> in some contexts, and flexbox and grid are unreliable. So this is
 * tables, inline styles, and a 600px fixed width — the boring approach that
 * actually arrives looking right.
 */

export type EmailContent = {
  preheader: string;
  headline: string;
  body: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerAddress: string;
};

export const DEFAULT_EMAIL: EmailContent = {
  preheader: "A short range for winding down. No app, nothing to charge.",
  headline: "Sleep is not a project",
  body: [
    "We made three things: a lamp that fades out over twenty minutes, a weighted throw, and a bedside carafe. That is the whole range.",
    "There is no app, no sleep score and nothing to charge. You turn the lamp on, it goes out on its own, and you do not think about it again.",
  ],
  ctaLabel: "See the range",
  ctaUrl: "https://example.com/range",
  footerAddress: "Halcyon (a fictional brand) · 1 Example Street · Demo City",
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildEmail(content: EmailContent = DEFAULT_EMAIL): string {
  const paragraphs = content.body
    .map(
      (p) =>
        `              <p style="margin:0 0 18px;font-family:'Public Sans',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#3C3545;">${escape(p)}</p>`,
    )
    .join("\n");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escape(content.headline)}</title>
  <!--[if mso]>
  <style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif !important;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0EAF2;">
  <!-- Preheader: shown in the inbox preview, hidden in the body. -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escape(content.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0EAF2;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#FBF7F2;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background-color:#2A1E3F;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;">
                    <img src="https://example.com/halcyon-mark.png" width="34" height="34" alt="" style="display:block;border:0;" />
                  </td>
                  <td>
                    <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#FBF7F2;">${escape(BRAND.name)}</span><br />
                    <span style="font-family:'Public Sans',Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#F3B98A;">${escape(BRAND.descriptor.toUpperCase())}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px;">
              <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:400;color:#2A1E3F;">${escape(content.headline)}</h1>
${paragraphs}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#A94F30" style="border-radius:24px;">
                    <a href="${escape(content.ctaUrl)}" style="display:inline-block;padding:14px 30px;font-family:'Public Sans',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#FBF7F2;text-decoration:none;border-radius:24px;">${escape(content.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background-color:#F2ECE4;border-top:1px solid #E3DAD0;">
              <p style="margin:0 0 8px;font-family:'Public Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6A6072;">${escape(content.footerAddress)}</p>
              <p style="margin:0;font-family:'Public Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6A6072;">
                <a href="{{unsubscribe_url}}" style="color:#6A6072;text-decoration:underline;">Unsubscribe</a> ·
                <a href="{{preferences_url}}" style="color:#6A6072;text-decoration:underline;">Email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text alternative. A multipart send needs both. */
export function buildPlainText(content: EmailContent = DEFAULT_EMAIL): string {
  return [
    BRAND.name.toUpperCase(),
    BRAND.descriptor,
    "",
    content.headline,
    "",
    ...content.body,
    "",
    `${content.ctaLabel}: ${content.ctaUrl}`,
    "",
    content.footerAddress,
    "Unsubscribe: {{unsubscribe_url}}",
  ].join("\n");
}
