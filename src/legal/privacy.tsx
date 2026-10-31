import { COMPANY, LEGAL_PATHS } from './company';
import type { LegalDoc } from './LegalPage';

const mail = (address: string) => <a href={`mailto:${address.replace(/[[\]]/g, '')}`}>{address}</a>;

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  summary:
    'How Svaraa collects, uses and protects personal data when you visit our website, reserve a pendant, or use Svaraa.',
  sections: [
    {
      id: 'who-we-are',
      heading: 'Who we are',
      body: (
        <>
          <p>
            This website and the Svaraa product are operated by {COMPANY.legalName} (&ldquo;Svaraa&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;), CIN {COMPANY.cin}, registered at {COMPANY.address}.
          </p>
          <p>
            We are the <strong>data fiduciary</strong> (data controller) for the personal data described in this
            policy. We follow India&rsquo;s Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;), the
            Information Technology Act, 2000 and the rules made under them. Where you are outside India and local law
            gives you additional rights, we will honour them.
          </p>
        </>
      ),
    },
    {
      id: 'scope',
      heading: 'What this policy covers',
      body: (
        <ul>
          <li>Our website, {COMPANY.website}, including the live product demo and the pre-order page.</li>
          <li>Reservations made through the pre-order form and paid through Stripe.</li>
          <li>
            The Svaraa pendant and family app, once available. Product-specific details will be added to this policy
            before the product ships.
          </li>
        </ul>
      ),
    },
    {
      id: 'data-we-collect',
      heading: 'Personal data we collect',
      body: (
        <>
          <h3>When you reserve a pendant</h3>
          <ul>
            <li>
              <strong>Contact details:</strong> full name, mobile number and email address.
            </li>
            <li>
              <strong>Delivery address:</strong> flat or house number and building, street or area, city, state and
              pincode.
            </li>
            <li>
              <strong>Order details:</strong> quantity, who will wear the pendant (you, a parent or another loved one),
              your reservation reference and your consent to be contacted.
            </li>
            <li>
              <strong>Payment details:</strong> payments are processed by Stripe. We receive confirmation of payment,
              the amount, and limited card information such as the card brand and last four digits. We never see or
              store your full card number or security code.
            </li>
          </ul>

          <h3>When you browse our website</h3>
          <ul>
            <li>
              <strong>Technical data:</strong> our hosting provider automatically records standard server logs, such as
              your IP address, browser type, the pages requested and the time of the request, to keep the website
              secure and running.
            </li>
            <li>
              <strong>Preferences stored on your device:</strong> your light or dark theme choice, and a temporary copy
              of the pre-order form while you complete payment. These stay in your browser and are not sent to us. See
              our <a href={LEGAL_PATHS.cookies}>Cookie Policy</a>.
            </li>
          </ul>

          <h3>When you use the Svaraa product (once available)</h3>
          <p>
            To provide reminders, conversation, fall detection and SOS alerts, Svaraa will need to process data such as
            voice requests, routines and reminders, motion data from the pendant, approximate location during an SOS,
            and the contact details of the family members you add to your care circle. Some of this may relate to
            health. We will only process it to provide the features you choose, with your consent, and we will describe
            it in full here before the product ships.
          </p>
        </>
      ),
    },
    {
      id: 'how-we-use',
      heading: 'How we use your data',
      body: (
        <ul>
          <li>To take and manage your reservation, including confirming it and contacting you about it.</li>
          <li>To process your reservation fee securely, and to handle refunds where they apply.</li>
          <li>To deliver your pendant to the address you give us, and to keep you updated on delivery.</li>
          <li>To answer your questions and provide customer support.</li>
          <li>To keep our website and services secure and to prevent fraud.</li>
          <li>To meet our legal, tax and accounting obligations.</li>
          <li>
            To send you news about Svaraa, only where you have agreed to it. You can opt out at any time using the link
            in any message or by contacting us.
          </li>
        </ul>
      ),
    },
    {
      id: 'legal-basis',
      heading: 'Consent and legal basis',
      body: (
        <>
          <p>
            We process your personal data on the basis of the <strong>consent</strong> you give when you submit the
            pre-order form, and for <strong>legitimate uses</strong> permitted by the DPDP Act, such as completing the
            reservation you asked for and meeting our legal obligations.
          </p>
          <p>
            You can withdraw your consent at any time by writing to {mail(COMPANY.privacyEmail)}. Withdrawing consent
            does not affect processing already carried out. If you withdraw consent needed for your reservation, we may
            not be able to complete it.
          </p>
        </>
      ),
    },
    {
      id: 'sharing',
      heading: 'Who we share it with',
      body: (
        <>
          <p>We do not sell your personal data. We share it only with service providers who help us run Svaraa:</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Provider</th>
                  <th scope="col">Purpose</th>
                  <th scope="col">Data shared</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stripe</td>
                  <td>Payment processing and fraud prevention</td>
                  <td>Name, email, reservation details, payment information</td>
                </tr>
                <tr>
                  <td>Vercel</td>
                  <td>Website hosting</td>
                  <td>Technical data in server logs</td>
                </tr>
                <tr>
                  <td>Google Fonts</td>
                  <td>Loading the website&rsquo;s typefaces</td>
                  <td>Your IP address and browser details</td>
                </tr>
                <tr>
                  <td>[Delivery partner]</td>
                  <td>Delivering your pendant</td>
                  <td>Name, mobile number and delivery address</td>
                </tr>
                <tr>
                  <td>[Email / messaging provider]</td>
                  <td>Reservation and delivery updates</td>
                  <td>Name, email and mobile number</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            These providers may only use your data to provide their service to us. We may also disclose data where the
            law requires it, or to protect the rights, safety or property of Svaraa, our users or others.
          </p>
        </>
      ),
    },
    {
      id: 'voice-demo',
      heading: 'The voice in our website demo',
      body: (
        <p>
          The live demo on our website speaks using your browser&rsquo;s built-in text-to-speech. Svaraa does not record
          or receive anything you do in the demo. Some browsers use online voices (for example, &ldquo;Google&rdquo;
          voices in Chrome or &ldquo;Online&rdquo; voices in Edge), which send the demo&rsquo;s scripted lines to the
          browser maker to be spoken. You can turn the demo&rsquo;s audio off at any time.
        </p>
      ),
    },
    {
      id: 'international',
      heading: 'Transfers outside India',
      body: (
        <p>
          Some of our service providers, including Stripe and Vercel, may process data on servers outside India. When
          this happens we rely on providers that apply strong safeguards, and we only transfer data to countries not
          restricted by the Government of India under the DPDP Act.
        </p>
      ),
    },
    {
      id: 'retention',
      heading: 'How long we keep it',
      body: (
        <ul>
          <li>Reservation and delivery details: until your pendant is delivered, plus [period] for support.</li>
          <li>Payment and invoice records: for the period required by Indian tax and accounting law.</li>
          <li>If you cancel or we cannot complete your reservation: [period] after it ends.</li>
          <li>Server logs: [period], unless needed to investigate a security issue.</li>
        </ul>
      ),
    },
    {
      id: 'security',
      heading: 'How we protect it',
      body: (
        <p>
          We use reasonable security safeguards, including encrypted connections (HTTPS), payment handling by a PCI DSS
          certified provider so card details never reach our servers, and access to personal data limited to people who
          need it. No system is completely secure. If a breach affects your personal data, we will notify you and the
          Data Protection Board of India as the law requires.
        </p>
      ),
    },
    {
      id: 'your-rights',
      heading: 'Your rights',
      body: (
        <>
          <p>Under the DPDP Act, you can:</p>
          <ul>
            <li>Ask for a summary of the personal data we hold about you and how we use it.</li>
            <li>Ask us to correct, complete or update inaccurate data.</li>
            <li>Ask us to erase your data when it is no longer needed, unless we must keep it by law.</li>
            <li>Withdraw your consent.</li>
            <li>Nominate someone to exercise these rights for you in the event of your death or incapacity.</li>
            <li>Raise a grievance with us, and then with the Data Protection Board of India.</li>
          </ul>
          <p>
            To exercise any of these rights, write to {mail(COMPANY.privacyEmail)}. We will respond within the time the
            law requires.
          </p>
        </>
      ),
    },
    {
      id: 'children',
      heading: 'Children',
      body: (
        <p>
          Reservations must be made by adults aged 18 or over. We do not knowingly collect personal data from children.
          If you believe a child has given us personal data, please contact us and we will delete it.
        </p>
      ),
    },
    {
      id: 'grievance',
      heading: 'Grievance Officer',
      body: (
        <>
          <p>If you have a concern about how we handle your personal data, please contact our Grievance Officer:</p>
          <p>
            <strong>{COMPANY.grievanceOfficer}</strong>
            <br />
            {COMPANY.legalName}
            <br />
            {COMPANY.address}
            <br />
            Email: {mail(COMPANY.grievanceEmail)}
          </p>
          <p>We will acknowledge your grievance and aim to resolve it within the time limits set by law.</p>
        </>
      ),
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      body: (
        <p>
          We will update this policy as Svaraa grows, in particular before the product ships. We will change the
          &ldquo;Last updated&rdquo; date above and, for significant changes, let you know by email or on our website.
        </p>
      ),
    },
  ],
};
