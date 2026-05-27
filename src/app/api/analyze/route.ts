import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function analyzeWebsite(url: string) {
  const startTime = Date.now();
  let html = '';
  let responseTime = 0;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebAnalyzer/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    responseTime = Date.now() - startTime;
    html = await response.text();
  } catch {
    return null;
  }

  if (!html) return null;

  const $ = cheerio.load(html);
  const isHttps = url.startsWith('https://');
  const hostname = new URL(url).hostname;

  // --- SEO ---
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const totalImages = $('img').length;
  const imagesWithAlt = $('img[alt]').filter((_, el) => ($(el).attr('alt') || '').trim().length > 0).length;
  const hasCanonical = $('link[rel="canonical"]').length > 0;
  const hasOgTitle = $('meta[property="og:title"]').length > 0;
  const hasOgDesc = $('meta[property="og:description"]').length > 0;
  const hasOgImage = $('meta[property="og:image"]').length > 0;

  let seoScore = 0;
  const seoPosHu: string[] = [], seoPosEn: string[] = [];
  const seoIssHu: string[] = [], seoIssEn: string[] = [];
  const seoSugHu: string[] = [], seoSugEn: string[] = [];

  if (title) {
    if (title.length >= 40 && title.length <= 65) {
      seoScore += 15;
      seoPosHu.push(`Title tag ideális hosszúságú (${title.length} karakter)`);
      seoPosEn.push(`Title tag has optimal length (${title.length} characters)`);
    } else {
      seoScore += 7;
      seoIssHu.push(`Title tag hossza nem ideális (${title.length} kar., ajánlott: 40-65)`);
      seoIssEn.push(`Title tag length not ideal (${title.length} chars, recommended: 40-65)`);
      seoSugHu.push('Állítsd be a title tag hosszát 40-65 karakter közé');
      seoSugEn.push('Adjust title tag length to 40-65 characters');
    }
  } else {
    seoIssHu.push('Hiányzó title tag');
    seoIssEn.push('Missing title tag');
    seoSugHu.push('Adj hozzá egy leíró title taget (40-65 karakter)');
    seoSugEn.push('Add a descriptive title tag (40-65 characters)');
  }

  if (metaDesc) {
    if (metaDesc.length >= 120 && metaDesc.length <= 160) {
      seoScore += 15;
      seoPosHu.push(`Meta leírás optimális (${metaDesc.length} karakter)`);
      seoPosEn.push(`Meta description is optimal (${metaDesc.length} characters)`);
    } else {
      seoScore += 7;
      seoIssHu.push(`Meta leírás hossza nem ideális (${metaDesc.length} kar., ajánlott: 120-160)`);
      seoIssEn.push(`Meta description not ideal (${metaDesc.length} chars, recommended: 120-160)`);
      seoSugHu.push('Optimalizáld a meta leírást 120-160 karakterre');
      seoSugEn.push('Optimize meta description to 120-160 characters');
    }
  } else {
    seoIssHu.push('Hiányzó meta leírás');
    seoIssEn.push('Missing meta description');
    seoSugHu.push('Adj hozzá meta leírást (120-160 karakter)');
    seoSugEn.push('Add a meta description (120-160 characters)');
  }

  if (h1Count === 1) {
    seoScore += 15;
    seoPosHu.push('Pontosan egy H1 tag van az oldalon');
    seoPosEn.push('Exactly one H1 tag present');
  } else if (h1Count > 1) {
    seoScore += 5;
    seoIssHu.push(`Több H1 tag (${h1Count} db) — csak egy ajánlott`);
    seoIssEn.push(`Multiple H1 tags (${h1Count}) — only one recommended`);
    seoSugHu.push('Hagyd meg csak egyetlen H1 taget');
    seoSugEn.push('Keep only a single H1 tag');
  } else {
    seoIssHu.push('Nincs H1 tag az oldalon');
    seoIssEn.push('No H1 tag found');
    seoSugHu.push('Adj hozzá H1 taget a főcímhez');
    seoSugEn.push('Add an H1 tag for the main heading');
  }

  if (h2Count > 0 || h3Count > 0) {
    seoScore += 10;
    seoPosHu.push(`Strukturált tartalom: ${h2Count} H2 és ${h3Count} H3 tag`);
    seoPosEn.push(`Structured content: ${h2Count} H2 and ${h3Count} H3 tags`);
  } else {
    seoSugHu.push('Adj hozzá H2/H3 tageket a tartalom strukturálásához');
    seoSugEn.push('Add H2/H3 tags to structure content');
  }

  if (totalImages > 0) {
    const altPct = Math.round((imagesWithAlt / totalImages) * 100);
    if (altPct >= 80) {
      seoScore += 10;
      seoPosHu.push(`Képek ${altPct}%-ának van alt szövege`);
      seoPosEn.push(`${altPct}% of images have alt text`);
    } else {
      seoIssHu.push(`Csak ${altPct}% képnek van alt szövege (${imagesWithAlt}/${totalImages})`);
      seoIssEn.push(`Only ${altPct}% of images have alt text (${imagesWithAlt}/${totalImages})`);
      seoSugHu.push('Adj alt szöveget minden képhez');
      seoSugEn.push('Add alt text to all images');
    }
  }

  if (hasCanonical) {
    seoScore += 10;
    seoPosHu.push('Canonical tag be van állítva');
    seoPosEn.push('Canonical tag is set');
  } else {
    seoSugHu.push('Adj hozzá canonical taget a duplikált tartalom elkerüléséhez');
    seoSugEn.push('Add a canonical tag to prevent duplicate content issues');
  }

  const ogCount = [hasOgTitle, hasOgDesc, hasOgImage].filter(Boolean).length;
  if (ogCount === 3) {
    seoScore += 10;
    seoPosHu.push('Open Graph tagek teljes körűek (közösségi megosztáshoz)');
    seoPosEn.push('Open Graph tags fully set (for social sharing)');
  } else if (ogCount > 0) {
    seoScore += 4;
    seoIssHu.push(`Open Graph tagek hiányosak (${ogCount}/3 van meg)`);
    seoIssEn.push(`Open Graph tags incomplete (${ogCount}/3 set)`);
    seoSugHu.push('Egészítsd ki az Open Graph tageket (og:title, og:description, og:image)');
    seoSugEn.push('Complete Open Graph tags (og:title, og:description, og:image)');
  } else {
    seoIssHu.push('Nincsenek Open Graph tagek');
    seoIssEn.push('No Open Graph tags found');
    seoSugHu.push('Adj hozzá Open Graph tageket a közösségi megosztáshoz');
    seoSugEn.push('Add Open Graph tags for social media sharing');
  }

  if (isHttps) {
    seoScore += 10;
    seoPosHu.push('HTTPS protokoll (SEO előny)');
    seoPosEn.push('HTTPS protocol (SEO advantage)');
  } else {
    seoIssHu.push('Nincs HTTPS — SEO hátrányt jelent');
    seoIssEn.push('No HTTPS — hurts SEO rankings');
    seoSugHu.push('Válts HTTPS-re SSL tanúsítvánnyal');
    seoSugEn.push('Switch to HTTPS with an SSL certificate');
  }

  if (metaKeywords) { seoScore += 5; }
  seoScore = Math.min(100, seoScore);

  // --- Technical ---
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasCharset = $('meta[charset]').length > 0 || html.toLowerCase().includes('charset=');
  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
  const htmlLang = $('html').attr('lang') || '';

  let techScore = 0;
  const techPosHu: string[] = [], techPosEn: string[] = [];
  const techIssHu: string[] = [], techIssEn: string[] = [];
  const techSugHu: string[] = [], techSugEn: string[] = [];

  if (isHttps) {
    techScore += 25;
    techPosHu.push('HTTPS / SSL tanúsítvány aktív');
    techPosEn.push('HTTPS / SSL certificate active');
  } else {
    techIssHu.push('HTTP kapcsolat — nincs SSL tanúsítvány');
    techIssEn.push('HTTP connection — no SSL certificate');
    techSugHu.push('Telepíts SSL tanúsítványt és irányítsd át a forgalmat HTTPS-re');
    techSugEn.push('Install SSL certificate and redirect traffic to HTTPS');
  }

  if (hasViewport) {
    techScore += 25;
    techPosHu.push('Viewport meta tag be van állítva (mobilbarát)');
    techPosEn.push('Viewport meta tag set (mobile-friendly)');
  } else {
    techIssHu.push('Hiányzó viewport meta — az oldal nem mobilbarát');
    techIssEn.push('Missing viewport meta — site not mobile-friendly');
    techSugHu.push('Add hozzá: <meta name="viewport" content="width=device-width, initial-scale=1">');
    techSugEn.push('Add: <meta name="viewport" content="width=device-width, initial-scale=1">');
  }

  if (responseTime < 1500) {
    techScore += 25;
    techPosHu.push(`Gyors betöltési idő (${responseTime}ms)`);
    techPosEn.push(`Fast loading time (${responseTime}ms)`);
  } else if (responseTime < 3000) {
    techScore += 12;
    techIssHu.push(`Lassú betöltés (${responseTime}ms, ajánlott: <1500ms)`);
    techIssEn.push(`Slow loading (${responseTime}ms, recommended: <1500ms)`);
    techSugHu.push('Optimalizáld a szerver válaszidőt, képek méretét és cache-t');
    techSugEn.push('Optimize server response time, image sizes and caching');
  } else {
    techIssHu.push(`Nagyon lassú betöltés (${responseTime}ms)`);
    techIssEn.push(`Very slow loading (${responseTime}ms)`);
    techSugHu.push('Sürgős: hosting csere vagy CDN bevezetése szükséges');
    techSugEn.push('Urgent: hosting upgrade or CDN implementation needed');
  }

  if (hasCharset) {
    techScore += 10;
    techPosHu.push('Karakterkódolás (charset) be van állítva');
    techPosEn.push('Character encoding (charset) is set');
  }

  if (hasFavicon) {
    techScore += 10;
    techPosHu.push('Favicon be van állítva');
    techPosEn.push('Favicon is configured');
  } else {
    techSugHu.push('Adj hozzá favicont a professzionális megjelenésért');
    techSugEn.push('Add a favicon for a professional look');
  }

  if (htmlLang) {
    techScore += 5;
    techPosHu.push(`HTML language attribútum: "${htmlLang}"`);
    techPosEn.push(`HTML language attribute: "${htmlLang}"`);
  } else {
    techSugHu.push('Adj lang attribútumot a <html> taghez (pl. lang="hu")');
    techSugEn.push('Add lang attribute to <html> tag (e.g., lang="en")');
  }

  techScore = Math.min(100, techScore);

  // --- Content ---
  $('script, style, nav, footer, noscript, header').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 2).length;

  const allLinks = $('a[href]');
  const internalLinks = allLinks.filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/') || href.includes(hostname);
  }).length;
  const externalLinks = allLinks.filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('http') && !href.includes(hostname);
  }).length;

  const pageHtmlLower = html.toLowerCase();
  const hasPhone = /(\+36|06[-\s]?\d{2}|\+\d{1,3})[\s.-]?\d{3,4}[\s.-]?\d{3,4}/.test(html);
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(pageHtmlLower);
  const hasCTA = /kapcsolat|ajánlat|vásárl|rendel|regisztr|iratkozz|contact|order|buy now|get started|sign up/i.test(pageHtmlLower);
  const hasSocial = /facebook\.com|instagram\.com|linkedin\.com|twitter\.com|tiktok\.com|youtube\.com/.test(pageHtmlLower);
  const hasPrivacy = /adatvédelem|privacy|cookie|gdpr/i.test(pageHtmlLower);

  let contentScore = 0;
  const contPosHu: string[] = [], contPosEn: string[] = [];
  const contIssHu: string[] = [], contIssEn: string[] = [];
  const contSugHu: string[] = [], contSugEn: string[] = [];

  if (wordCount >= 600) {
    contentScore += 20;
    contPosHu.push(`Gazdag szöveges tartalom (${wordCount} szó)`);
    contPosEn.push(`Rich text content (${wordCount} words)`);
  } else if (wordCount >= 300) {
    contentScore += 10;
    contIssHu.push(`Közepes szövegmennyiség (${wordCount} szó, ajánlott: 600+)`);
    contIssEn.push(`Moderate content (${wordCount} words, recommended: 600+)`);
    contSugHu.push('Bővítsd a szöveges tartalmat legalább 600 szóra');
    contSugEn.push('Expand text content to at least 600 words');
  } else {
    contIssHu.push(`Kevés szöveges tartalom (${wordCount} szó)`);
    contIssEn.push(`Thin content (${wordCount} words)`);
    contSugHu.push('Adj hozzá több leíró szöveget az oldalhoz');
    contSugEn.push('Add more descriptive text content to the page');
  }

  if (internalLinks > 3) {
    contentScore += 15;
    contPosHu.push(`Jó belső linkelés (${internalLinks} belső link)`);
    contPosEn.push(`Good internal linking (${internalLinks} internal links)`);
  } else if (internalLinks > 0) {
    contentScore += 7;
    contIssHu.push(`Kevés belső link (${internalLinks} db)`);
    contIssEn.push(`Few internal links (${internalLinks})`);
    contSugHu.push('Adj hozzá több belső linket a navigáció és SEO javításához');
    contSugEn.push('Add more internal links to improve navigation and SEO');
  } else {
    contIssHu.push('Nincsenek belső linkek');
    contIssEn.push('No internal links found');
    contSugHu.push('Adj hozzá belső linkeket az aloldalakhoz');
    contSugEn.push('Add internal links to subpages');
  }

  if (externalLinks > 0) {
    contentScore += 5;
    contPosHu.push(`${externalLinks} külső link az oldalon`);
    contPosEn.push(`${externalLinks} external links on the page`);
  }

  if (totalImages > 0) {
    contentScore += 10;
    contPosHu.push(`${totalImages} kép az oldalon`);
    contPosEn.push(`${totalImages} images on the page`);
  } else {
    contSugHu.push('Adj hozzá képeket a vizuális megjelenéshez');
    contSugEn.push('Add images to improve visual appearance');
  }

  if (hasPhone) {
    contentScore += 12;
    contPosHu.push('Telefonszám megtalálható');
    contPosEn.push('Phone number found');
  } else {
    contIssHu.push('Nincs telefonszám az oldalon');
    contIssEn.push('No phone number found');
    contSugHu.push('Add meg a telefonszámodat az oldalon');
    contSugEn.push('Add your phone number to the page');
  }

  if (hasEmail) {
    contentScore += 12;
    contPosHu.push('Email elérhetőség megtalálható');
    contPosEn.push('Email address found');
  } else {
    contIssHu.push('Nincs email cím az oldalon');
    contIssEn.push('No email address found');
    contSugHu.push('Tegyél ki egy email elérhetőséget');
    contSugEn.push('Add an email address to the page');
  }

  if (hasCTA) {
    contentScore += 13;
    contPosHu.push('Cselekvésre ösztönző szöveg/gomb (CTA) van az oldalon');
    contPosEn.push('Call-to-action text/button found');
  } else {
    contIssHu.push('Nincs egyértelmű CTA (cselekvésre ösztönzés)');
    contIssEn.push('No clear call-to-action found');
    contSugHu.push('Adj hozzá CTA gombot (pl. "Kérj ajánlatot", "Kapcsolat")');
    contSugEn.push('Add a CTA button (e.g. "Get a Quote", "Contact Us")');
  }

  if (hasSocial) {
    contentScore += 8;
    contPosHu.push('Közösségi média linkek megtalálhatók');
    contPosEn.push('Social media links found');
  } else {
    contSugHu.push('Adj hozzá közösségi média linkeket');
    contSugEn.push('Add social media links');
  }

  if (hasPrivacy) {
    contentScore += 5;
    contPosHu.push('Adatvédelmi / GDPR tartalom megtalálható');
    contPosEn.push('Privacy / GDPR content found');
  } else {
    contIssHu.push('Nincs adatvédelmi tájékoztató (GDPR kötelező!)');
    contIssEn.push('No privacy policy (GDPR required!)');
    contSugHu.push('Adj hozzá adatvédelmi tájékoztatót — GDPR szerint kötelező');
    contSugEn.push('Add a privacy policy — required by GDPR');
  }

  contentScore = Math.min(100, contentScore);

  const overallScore = Math.round(seoScore * 0.35 + techScore * 0.3 + contentScore * 0.35);

  const scores = { seoScore, techScore, contentScore };
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const worst = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  const areaNameHu = (k: string) => k === 'seoScore' ? 'SEO' : k === 'techScore' ? 'technikai felépítés' : 'tartalom';
  const areaNameEn = (k: string) => k === 'seoScore' ? 'SEO' : k === 'techScore' ? 'technical setup' : 'content';

  const summaryHu = overallScore >= 75
    ? `A weboldal összességében jó állapotban van (${overallScore}/100). Legjobb terület: ${areaNameHu(best)}. Kisebb finomhangolásokkal még jobb eredmény érhető el.`
    : overallScore >= 50
    ? `A weboldal fejlesztést igényel (${overallScore}/100). Leggyengébb terület: ${areaNameHu(worst)}. Az ajánlások követésével jelentősen javítható a teljesítmény.`
    : `A weboldal komoly fejlesztést igényel (${overallScore}/100). Több kritikus probléma azonosítható — az összes ajánlás implementálása javasolt.`;

  const summaryEn = overallScore >= 75
    ? `The website is in good overall condition (${overallScore}/100). Best area: ${areaNameEn(best)}. Minor improvements can further boost performance.`
    : overallScore >= 50
    ? `The website needs improvements (${overallScore}/100). Weakest area: ${areaNameEn(worst)}. Following the recommendations will significantly improve performance.`
    : `The website requires significant work (${overallScore}/100). Multiple critical issues identified — all recommendations should be implemented.`;

  return {
    overall_score: overallScore,
    site_title: title || hostname,
    summary_hu: summaryHu,
    summary_en: summaryEn,
    seo: { score: seoScore, positives_hu: seoPosHu, positives_en: seoPosEn, issues_hu: seoIssHu, issues_en: seoIssEn, suggestions_hu: seoSugHu, suggestions_en: seoSugEn },
    technical: { score: techScore, response_time: responseTime, positives_hu: techPosHu, positives_en: techPosEn, issues_hu: techIssHu, issues_en: techIssEn, suggestions_hu: techSugHu, suggestions_en: techSugEn },
    content: { score: contentScore, word_count: wordCount, internal_links: internalLinks, external_links: externalLinks, images: totalImages, positives_hu: contPosHu, positives_en: contPosEn, issues_hu: contIssHu, issues_en: contIssEn, suggestions_hu: contSugHu, suggestions_en: contSugEn },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url, description } = await request.json();
    if (!url || !description) return NextResponse.json({ error: 'URL és leírás szükséges.' }, { status: 400 });

    const result = await analyzeWebsite(url);
    if (!result) return NextResponse.json({ error: 'A weboldal nem elérhető vagy nem sikerült lekérni.' }, { status: 400 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Hiba történt az elemzés során.' }, { status: 500 });
  }
}
