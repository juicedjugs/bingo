import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import createEmotionCache from "./utils/cache";
import { CacheProvider } from "@emotion/react";
import AppTheme from "./utils/theme";
import "./utils/icons";
import { StateProvider, TileIdeasProvider } from "./state";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bingo Maker</title>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(l) {
                if (l.search[1] === '/') {
                  var decoded = l.search.slice(1).split('&').map(function(s) { 
                    return s.replace(/~and~/g, '&')
                  }).join('?');
                  window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
                }
              })(window.location);
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const cache = createEmotionCache();

export default function Root() {
  if (typeof window !== "undefined") {
    return (
      <CacheProvider value={cache}>
        <AppTheme>
          <StateProvider>
            <TileIdeasProvider>
              <Outlet />
            </TileIdeasProvider>
          </StateProvider>
        </AppTheme>
      </CacheProvider>
    );
  }
  return (
    <AppTheme>
      <StateProvider>
        <TileIdeasProvider>
          <Outlet />
        </TileIdeasProvider>
      </StateProvider>
    </AppTheme>
  );
}
