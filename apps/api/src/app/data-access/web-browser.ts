import { IDelaySec, IImageType, ITargetUrl } from '@crvouga/screenshot-service';
import puppeteer, { Browser } from 'puppeteer';
import { IScreenshotData } from '../types';

export type WebBrowser = puppeteer.Browser;

type Result =
  | {
      type: 'success';
      updatedAtMs: number;
      data: IScreenshotData;
      imageType: IImageType;
    }
  | {
      type: 'error';
      errors: [{ message: string }];
    };

export const openNewPage = async (browser: puppeteer.Browser) => {
  const page = await browser.newPage();
  return page;
};

export const goTo = async (page: puppeteer.Page, url: ITargetUrl) => {
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });
};

export const takeScreenshot = async (
  page: puppeteer.Page,
  imageType: IImageType
) => {
  try {
    const buffer = await page.screenshot({
      type: imageType,
    });

    if (typeof buffer !== 'string' && !buffer) {
      return {
        type: 'error',
        errors: [
          {
            message: 'puppeteer did not return a buffer for the screenshot',
          },
        ],
      };
    }

    return { type: 'success', buffer };
  } catch (error) {
    const message = String(error?.toString?.() ?? 'puppeteer threw an error');

    return {
      type: 'error',
      errors: [
        {
          message,
        },
      ],
    };
  }
};

//
//
//
//
//
//
//

let browser: Browser | null = null;

export const create = async () => {
  //
  if (browser) {
    return browser;
  }

  browser = await puppeteer.launch({
    //why?: https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
    args: [
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--single-process',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
    ],

    headless: true,
    ignoreHTTPSErrors: true,
  });

  return browser;
};

const secToMs = (secs: number) => secs * 1000;

const createDelay = ({ seconds }: { seconds: number }) => {
  return new Promise((resolve) => {
    setTimeout(resolve, secToMs(seconds));
  });
};
