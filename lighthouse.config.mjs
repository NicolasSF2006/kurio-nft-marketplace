import { userAgents } from 'lighthouse/core/config/constants.js'

const desktop = process.env.LIGHTHOUSE_PROFILE === 'desktop'

export default {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: desktop ? 'desktop' : 'mobile',
    emulatedUserAgent: desktop ? userAgents.desktop : userAgents.mobile,
    screenEmulation: {
      mobile: !desktop,
      width: desktop ? 1440 : 390,
      height: desktop ? 900 : 844,
      deviceScaleFactor: desktop ? 1 : 3,
      disabled: false,
    },
    throttlingMethod: 'simulate',
    ...(desktop ? {
      throttling: {
        rttMs: 40,
        throughputKbps: 10_240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    } : {}),
  },
}

