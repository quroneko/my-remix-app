/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  // Check if the response is cached
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), request);
  const cache = caches.default;
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return new Response(cachedResponse.body, {
      headers: {
        ...cachedResponse.headers,
        "Custom-Cache-Status": "HIT",
      },
      status: cachedResponse.status,
    });
  }

  // Render the app
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY);
  const body = await renderToReadableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          // Log streaming rendering errors from inside the shell
          console.error(error);
        }
        responseStatusCode = 500;
      },
    }
  );

  // Clear the timeout
  body.allReady.then(() => clearTimeout(timeoutId));

  // Wait for the app to be ready
  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  if (url.pathname.startsWith("/users")) {
    // Set cache control for users route
    responseHeaders.set("Cache-Control", "max-age=60");
  }

  // Create the response
  const response = new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });

  // Cache the response
  if (request.method === "GET" && responseStatusCode === 200) {
    loadContext.cloudflare.ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
