import {
  API_ENDPOINT,
  GET_SCREENSHOT_ENDPOINT,
  IApiErrorBody,
  IGetScreenshotQueryParams,
} from '@crvouga/screenshot-service';
import {
  castImageType,
  castMaxAgeMs,
  castTargetUrl,
  castTimeoutMs,
  resultToErrors,
} from '@screenshot-service/shared';
import { Application, ErrorRequestHandler, Router } from 'express';
import { Browser } from 'puppeteer';
import env from './dotenv';
import { getScreenshot } from './screenshot-data-access/screenshot-data-access';
import * as ScreenshotPuppeteer from './screenshot-data-access/screenshot-data-access-puppeteer';

export const useApi = async (app: Application) => {
  const browser = await ScreenshotPuppeteer.createPuppeteerBrowser();

  const router = Router();

  useGetScreenshot(browser, router);

  useErrorHandler(browser, router);

  app.use(API_ENDPOINT, router);
};

/**
 *
 *
 *
 * get screenshot
 *
 *
 *
 */

const useGetScreenshot = async (browser: Browser, router: Router) => {
  router.get(GET_SCREENSHOT_ENDPOINT, async (req, res) => {
    const clientUrl = req.headers.origin ?? req.headers.referer;

    console.log({ clientUrl });

    const queryParams: Partial<IGetScreenshotQueryParams> = req.query;

    const timeoutMsResult = castTimeoutMs(queryParams.timeoutMs);
    const targetUrlResult = castTargetUrl(queryParams.targetUrl);
    const imageTypeResult = castImageType(queryParams.imageType);
    const apiKeyResult =
      typeof queryParams.apiKey === 'string'
        ? { type: 'success', data: queryParams.apiKey }
        : { type: 'error' };

    if (
      !(
        timeoutMsResult.type === 'success' &&
        targetUrlResult.type === 'success' &&
        imageTypeResult.type === 'success'
      )
    ) {
      const apiErrorBody: IApiErrorBody = [
        ...resultToErrors(timeoutMsResult),
        ...resultToErrors(targetUrlResult),
        ...resultToErrors(imageTypeResult),
      ];

      res.status(400).json(apiErrorBody);
      return;
    }

    const result = await getScreenshot(browser, {
      imageType: imageTypeResult.data,
      timeoutMs: timeoutMsResult.data,
      targetUrl: targetUrlResult.data,
      apiKey: apiKeyResult.data,
    });

    if (result.type === 'error') {
      const apiErrorBody: IApiErrorBody = result.errors;

      res.status(400).json(apiErrorBody).end();
      return;
    }

    const statusCode = result.source === 'FromPuppeteer' ? 201 : 200;

    res
      .writeHead(statusCode, {
        'Content-Type': result.imageType,
        'Content-Length': result.data.length,
      })
      .end(result.data);
  });
};

/**
 *
 *
 *
 * security
 *
 *
 *
 */

const useSecurity = async (router: Router) => {
  router.use(async (req, res, next) => {
    const whitelist = await getWhitelist();
    const clientUrl = req.headers.origin ?? req.headers.referer;

    if (!clientUrl) {
      const apiErrorBody: IApiErrorBody = [
        {
          message: `'origin' header is undefined or 'referer' header is undefined. One of these headers has to be defined so I can check if you are on the whitelist.`,
        },
      ];

      res.status(400).json(apiErrorBody).end();
      return;
    }

    if (isOnWhitelist(whitelist, clientUrl)) {
      next();
      return;
    }

    const apiErrorBody: IApiErrorBody = [
      {
        message: `You are not on the whitelist. Your url is ${clientUrl}. Whitelisted urls are: ${whitelist.join(
          ', '
        )} `,
      },
    ];

    res.status(400).json(apiErrorBody).end();
  });
};

export const getWhitelist = async () => {
  return env.URL_WHITELIST_CSV?.split(',').map((item) => item.trim()) ?? [];
};

const toHostname = (maybeUrl: string) => {
  try {
    return new URL(maybeUrl).hostname;
  } catch (_error) {
    return maybeUrl;
  }
};

export const isOnWhitelist = (whitelist: string[], item: string) => {
  return whitelist.some((whitelistedItem) => {
    return toHostname(whitelistedItem) === toHostname(item);
  });
};

/**
 *
 *
 *
 * error handler
 *
 *
 *
 */

const useErrorHandler = (browser: Browser, router: Router) => {
  const errorHandler: ErrorRequestHandler = (_err, _req, _res, next) => {
    browser.close();
    next();
  };

  router.use(errorHandler);
};
