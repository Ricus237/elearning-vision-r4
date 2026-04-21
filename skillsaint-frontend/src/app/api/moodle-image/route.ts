import { NextRequest, NextResponse } from "next/server";

const MOODLE_TOKEN = process.env.MOODLE_TOKEN || "";

/**
 * Proxy server-side pour les images Moodle.
 * Gère deux cas :
 * 1. Fichiers publics (generated SVGs) → accès direct sans token
 * 2. Fichiers privés (overviewfiles, uploads) → webservice/pluginfile.php + token
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    let moodleUrl = decodeURIComponent(url);
    
    // Nettoyer : enlever le token existant s'il y en a un (on va mettre le bon)
    moodleUrl = moodleUrl.replace(/[?&]token=[^&]+/g, '').replace(/[?&]forcedownload=[^&]+/g, '');
    // Nettoyer les ? ou & orphelins en fin d'URL
    moodleUrl = moodleUrl.replace(/[?&]$/, '');

    // Stratégie 1 : Essayer l'URL originale directement (fonctionne pour les fichiers publics/generated)
    const directUrl = moodleUrl.includes('webservice/pluginfile.php') 
      ? moodleUrl.replace('webservice/pluginfile.php', 'pluginfile.php')
      : moodleUrl;
    
    let response = await fetch(directUrl, {
      headers: { "Accept": "image/*,*/*" },
      redirect: "follow",
    });

    // Stratégie 2 : Si l'accès direct échoue, essayer avec webservice/ + token
    if (!response.ok) {
      let wsUrl = moodleUrl;
      if (wsUrl.includes('pluginfile.php') && !wsUrl.includes('webservice/pluginfile.php')) {
        wsUrl = wsUrl.replace('pluginfile.php', 'webservice/pluginfile.php');
      }
      const sep = wsUrl.includes('?') ? '&' : '?';
      wsUrl = `${wsUrl}${sep}token=${MOODLE_TOKEN}&forcedownload=0`;

      response = await fetch(wsUrl, {
        headers: { "Accept": "image/*,*/*" },
        redirect: "follow",
      });
    }

    if (!response.ok) {
      console.error(`[moodle-image] All attempts failed for: ${moodleUrl}`);
      return new NextResponse(null, { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Si on reçoit du HTML au lieu d'une image, c'est une erreur Moodle (login, 403, etc.)
    if (contentType.includes("text/html")) {
      console.warn(`[moodle-image] Received HTML instead of image for: ${moodleUrl}`);
      return new NextResponse(null, { status: 404 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("[moodle-image] Proxy error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
