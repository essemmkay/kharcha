// Curated Pakistani banks (and the major wallets people use as accounts). The
// domain drives the logo lookup (Clearbit), which is far more reliable than
// guessing a domain from a free-text account name. A bank the logo CDN doesn't
// have simply falls back to a monogram badge in AccountAvatar.
export type Bank = { slug: string; name: string; domain: string };

export const PK_BANKS: Bank[] = [
  { slug: "hbl", name: "HBL", domain: "hbl.com" },
  { slug: "ubl", name: "UBL", domain: "ubldigital.com" },
  { slug: "mcb", name: "MCB Bank", domain: "mcb.com.pk" },
  { slug: "abl", name: "Allied Bank", domain: "abl.com" },
  { slug: "meezan", name: "Meezan Bank", domain: "meezanbank.com" },
  { slug: "alfalah", name: "Bank Alfalah", domain: "alfalah.com" },
  { slug: "sc", name: "Standard Chartered", domain: "sc.com" },
  { slug: "faysal", name: "Faysal Bank", domain: "faysalbank.com" },
  { slug: "askari", name: "Askari Bank", domain: "askaribank.com" },
  { slug: "bahl", name: "Bank Al Habib", domain: "bankalhabib.com" },
  { slug: "js", name: "JS Bank", domain: "jsbl.com" },
  { slug: "soneri", name: "Soneri Bank", domain: "soneribank.com" },
  { slug: "habibmetro", name: "Habib Metro", domain: "habibmetro.com" },
  { slug: "nbp", name: "National Bank (NBP)", domain: "nbp.com.pk" },
  { slug: "bop", name: "Bank of Punjab", domain: "bop.com.pk" },
  { slug: "dib", name: "Dubai Islamic", domain: "dibpak.com" },
  { slug: "bankislami", name: "BankIslami", domain: "bankislami.com.pk" },
  { slug: "summit", name: "Summit Bank", domain: "summitbank.com.pk" },
  { slug: "sindh", name: "Sindh Bank", domain: "sindhbank.com.pk" },
  { slug: "silk", name: "Silkbank", domain: "silkbank.com.pk" },
  { slug: "easypaisa", name: "Easypaisa", domain: "easypaisa.com.pk" },
  { slug: "jazzcash", name: "JazzCash", domain: "jazzcash.com.pk" },
  { slug: "sadapay", name: "SadaPay", domain: "sadapay.pk" },
  { slug: "nayapay", name: "NayaPay", domain: "nayapay.com" },
];

const BY_SLUG = new Map(PK_BANKS.map((b) => [b.slug, b]));

export function bankBySlug(slug: string | null | undefined): Bank | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}
