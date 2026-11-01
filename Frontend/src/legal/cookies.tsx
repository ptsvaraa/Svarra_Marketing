import { COMPANY, LEGAL_PATHS } from './company';
import type { LegalDoc } from './LegalPage';

const mail = (address: string) => <a href={`mailto:${address.replace(/[[\]]/g, '')}`}>{address}</a>;

/**
 * Keep this list in step with the code: every key the site stores in the
 * browser, and every third party that can set cookies, should appear here.
 */
export const COOKIE_POLICY: LegalDoc = {
  title: 'Cookie Policy',
  summary: 'What our website stores on your device, why, and how you can control it.',
  sections: [
    {
      id: 'summary',
      heading: 'In short',
      body: (
        <>
          <p>
            <strong>Svaraa&rsquo;s website does not set any cookies of its own</strong>, and we do not use analytics,
            advertising or tracking cookies.
          </p>
          <p>
            We store two small items in your browser to make the website work, and a few trusted services we rely on
            may use cookies or receive technical data. Each is listed below. If we ever add analytics or marketing
            tools, we will update this policy and ask for your consent first.
          </p>
        </>
      ),
    },
    {
      id: 'what-are-cookies',
      heading: 'Cookies and similar technologies',
      body: (
        <p>
          Cookies are small text files a website saves on your device. Browsers also offer similar storage, called
          local storage and session storage. Session storage is cleared when you close the tab; local storage stays
          until you clear it. This policy covers all of them.
        </p>
      ),
    },
    {
      id: 'our-storage',
      heading: 'What we store on your device',
      body: (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Purpose</th>
                <th scope="col">How long</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>svaraa-theme</code>
                </td>
                <td>Local storage · Functional</td>
                <td>Remembers whether you chose light or dark mode.</td>
                <td>Until you clear your browser data</td>
              </tr>
              <tr>
                <td>
                  <code>svaraa-preorder-draft</code>
                </td>
                <td>Session storage · Strictly necessary</td>
                <td>
                  Keeps your pre-order form filled in while you complete payment on Stripe, so you don&rsquo;t have to
                  type it again if you return. It is deleted once payment is confirmed.
                </td>
                <td>Until you close the tab</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'third-parties',
      heading: 'Third-party services',
      body: (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">When</th>
                <th scope="col">What happens</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Stripe</td>
                <td>When you pay a reservation fee</td>
                <td>
                  Stripe&rsquo;s secure payment page sets strictly necessary cookies for payment security and fraud
                  prevention, under{' '}
                  <a href="https://stripe.com/cookie-settings" target="_blank" rel="noopener noreferrer">
                    Stripe&rsquo;s cookie policy
                  </a>
                  .
                </td>
              </tr>
              <tr>
                <td>Google Fonts</td>
                <td>Every page</td>
                <td>
                  Our typefaces load from Google, which receives your IP address and browser details. Google states it
                  does not set cookies for this service.
                </td>
              </tr>
              <tr>
                <td>Vercel</td>
                <td>Every page</td>
                <td>Our hosting provider records standard server logs to keep the website secure. No cookies are set.</td>
              </tr>
              <tr>
                <td>Your browser&rsquo;s voice</td>
                <td>Only if you play the live demo with audio on</td>
                <td>
                  Some browsers use online voices that send the demo&rsquo;s scripted lines to the browser maker to be
                  spoken. See our <a href={LEGAL_PATHS.privacy}>Privacy Policy</a>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'control',
      heading: 'How to control it',
      body: (
        <>
          <p>
            You can clear or block site storage and cookies in your browser&rsquo;s settings, usually under
            &ldquo;Privacy&rdquo; or &ldquo;Site data&rdquo;. If you do:
          </p>
          <ul>
            <li>the website will use your device&rsquo;s light or dark setting instead of the theme you chose;</li>
            <li>your pre-order form will not be refilled if you leave the payment page and come back.</li>
          </ul>
          <p>Blocking cookies on Stripe&rsquo;s payment page may stop the payment from completing.</p>
        </>
      ),
    },
    {
      id: 'contact',
      heading: 'Questions',
      body: <p>If you have any questions about this policy, write to {mail(COMPANY.privacyEmail)}.</p>,
    },
  ],
};
