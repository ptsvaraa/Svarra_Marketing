import {
  BALANCE_ON_DELIVERY_USD,
  BUSINESS_BOOKING_PER_PENDANT_USD,
  BUSINESS_CONTACT_EMAIL,
  BUSINESS_HOLD_FEE_USD,
  BUSINESS_MAX_QUANTITY,
  BUSINESS_MIN_QUANTITY,
  formatFee,
  LIST_PRICE_USD,
  MAX_QUANTITY,
  PREORDER_DISCOUNT_PERCENT,
  PREORDER_PRICE_USD,
  PRODUCT_NAME,
  RESERVATION_FEE_USD,
} from '../data/preorder';
import { COMPANY, LEGAL_PATHS } from './company';
import type { LegalDoc } from './LegalPage';

const mail = (address: string) => <a href={`mailto:${address.replace(/[[\]]/g, '')}`}>{address}</a>;
const fee = formatFee(RESERVATION_FEE_USD);

export const TERMS: LegalDoc = {
  title: 'Terms & Conditions',
  summary: `The terms for using the Svaraa website and for reserving a ${PRODUCT_NAME} pendant.`,
  sections: [
    {
      id: 'agreement',
      heading: 'About these terms',
      body: (
        <>
          <p>
            These terms are an agreement between you and {COMPANY.legalName} (&ldquo;Svaraa&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;), registered at {COMPANY.address}. By using {COMPANY.website} or making a reservation, you
            agree to them. If you do not agree, please do not use the website or make a reservation.
          </p>
          <p>
            Our <a href={LEGAL_PATHS.privacy}>Privacy Policy</a> and <a href={LEGAL_PATHS.cookies}>Cookie Policy</a>{' '}
            explain how we handle your data and form part of these terms.
          </p>
        </>
      ),
    },
    {
      id: 'eligibility',
      heading: 'Who can reserve',
      body: (
        <p>
          You must be at least 18 years old and able to enter into a binding contract under Indian law. You may reserve
          for yourself or on behalf of a family member, in which case you confirm that you have their agreement to share
          their details with us for delivery.
        </p>
      ),
    },
    {
      id: 'reservations',
      heading: 'Reservations',
      body: (
        <>
          <ul>
            <li>
              A reservation costs <strong>{fee} per pendant</strong>, paid securely through Stripe. It holds your place
              in the limited first edition of {PRODUCT_NAME}.
            </li>
            <li>
              The reservation fee is <strong>not the full price</strong> of the pendant. {PRODUCT_NAME} is priced at{' '}
              {formatFee(LIST_PRICE_USD)}; pre-orders receive a {PREORDER_DISCOUNT_PERCENT}% discount, for a pre-order
              price of {formatFee(PREORDER_PRICE_USD)} per pendant. The reservation fee counts towards that price, and
              the balance of {formatFee(BALANCE_ON_DELIVERY_USD)} per pendant, plus applicable taxes and delivery
              charges, is due once we start delivery. We will confirm the amount due and the expected delivery date
              before your pendant ships, and you can decide then whether to complete your order.
            </li>
            <li>Each household may reserve up to {MAX_QUANTITY} pendants.</li>
            <li>
              Businesses and organisations may reserve between {BUSINESS_MIN_QUANTITY} and {BUSINESS_MAX_QUANTITY}{' '}
              pendants online. A business reservation costs {formatFee(BUSINESS_HOLD_FEE_USD)} to hold your place plus a
              booking amount of {formatFee(BUSINESS_BOOKING_PER_PENDANT_USD)} per pendant (for example,{' '}
              {BUSINESS_MAX_QUANTITY} pendants cost{' '}
              {formatFee(BUSINESS_HOLD_FEE_USD + BUSINESS_BOOKING_PER_PENDANT_USD * BUSINESS_MAX_QUANTITY)} in total).
              For more than {BUSINESS_MAX_QUANTITY}, please contact us first at {mail(BUSINESS_CONTACT_EMAIL)}.
            </li>
            <li>
              Your reservation is confirmed once payment succeeds and you see your reservation reference. We will also
              confirm it by email.
            </li>
            <li>
              First-edition quantities are limited. Reservations are fulfilled in the order they are confirmed, and we
              cannot guarantee a delivery date until we confirm it with you.
            </li>
            <li>
              Product images, illustrations and the live demo on our website show the intended design and features. The
              final product may differ as development continues.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'refunds',
      heading: 'Cancellations and refunds',
      body: (
        <>
          <ul>
            <li>
              <strong>If you cancel:</strong> [state whether the reservation fee is refundable, for how long, and how to
              request it, e.g. &ldquo;You may cancel and receive a full refund of your reservation fee at any time
              before your pendant ships, by writing to us.&rdquo;]
            </li>
            <li>
              <strong>If we cancel:</strong> if we cannot fulfil your reservation for any reason, we will refund your
              reservation fee in full.
            </li>
            <li>
              Approved refunds are returned to the original payment method within [number] business days. Your bank may
              take longer to show it.
            </li>
            <li>
              Because the fee is charged in US dollars, the amount shown by your bank may vary slightly with exchange
              rates and any fees your bank charges. We cannot refund bank or currency conversion charges.
            </li>
          </ul>
          <p>To cancel or request a refund, write to {mail(COMPANY.supportEmail)} with your reservation reference.</p>
        </>
      ),
    },
    {
      id: 'safety',
      heading: 'Important safety information',
      body: (
        <>
          <p>
            <strong>
              Svaraa is a wellbeing and connection device. It is not a medical device and is not an emergency service.
            </strong>
          </p>
          <ul>
            <li>
              Svaraa&rsquo;s SOS and fall detection alert the family contacts you choose. The first version does not
              contact ambulance, police, fire or other emergency services. In an emergency, always call 112 or your
              local emergency number.
            </li>
            <li>
              Fall detection may not detect every fall and may occasionally alert when there is no fall. Alerts depend
              on the pendant&rsquo;s battery, a working phone connection and network coverage.
            </li>
            <li>
              Reminders, including medicine reminders, support routines but do not replace advice from a doctor or
              pharmacist. Never change medication because of a reminder without professional advice.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'website-use',
      heading: 'Using our website',
      body: (
        <>
          <p>You agree not to:</p>
          <ul>
            <li>use the website for anything unlawful, or give false information when reserving;</li>
            <li>try to gain unauthorised access to, disrupt or overload the website or its systems;</li>
            <li>copy, scrape or reuse the website&rsquo;s content, except as allowed by law.</li>
          </ul>
          <p>
            We may update, suspend or withdraw any part of the website at any time. We aim to keep it available and
            accurate, but cannot guarantee it will always be uninterrupted or error-free.
          </p>
        </>
      ),
    },
    {
      id: 'ip',
      heading: 'Our content and trademarks',
      body: (
        <p>
          The Svaraa name, lotus logo, product designs, text, images and software on this website belong to us or our
          licensors and are protected by intellectual property law. You may view and share pages for personal,
          non-commercial use. Logos of universities and companies shown on the website belong to their owners and
          indicate our team&rsquo;s background; they do not imply endorsement.
        </p>
      ),
    },
    {
      id: 'third-parties',
      heading: 'Third-party services and links',
      body: (
        <p>
          Payments are handled by Stripe under Stripe&rsquo;s own terms. Our website links to other sites, such as our
          social media pages. We are not responsible for the content or practices of third-party sites and services.
        </p>
      ),
    },
    {
      id: 'liability',
      heading: 'Limitation of liability',
      body: (
        <>
          <p>
            Nothing in these terms limits any liability that cannot be limited by law, including your rights under the
            Consumer Protection Act, 2019.
          </p>
          <p>
            Subject to that, our total liability to you in connection with a reservation is limited to the reservation
            fees you paid us. We are not liable for indirect or consequential losses, or for delays caused by events
            outside our reasonable control, such as supply shortages, natural disasters or network outages.
          </p>
        </>
      ),
    },
    {
      id: 'law',
      heading: 'Governing law and disputes',
      body: (
        <p>
          These terms are governed by the laws of India. We will try to resolve any concern with you directly first;
          please contact us. Any dispute that cannot be resolved this way is subject to the exclusive jurisdiction of
          the courts at {COMPANY.jurisdictionCity}, India, without affecting your right to approach a consumer
          commission.
        </p>
      ),
    },
    {
      id: 'changes',
      heading: 'Changes to these terms',
      body: (
        <p>
          We may update these terms, for example when the product launches. Changes apply from the &ldquo;Last
          updated&rdquo; date above and do not affect reservations already confirmed, unless the law requires otherwise.
        </p>
      ),
    },
    {
      id: 'contact',
      heading: 'Contact us',
      body: (
        <p>
          {COMPANY.legalName}
          <br />
          {COMPANY.address}
          <br />
          Email: {mail(COMPANY.supportEmail)}
          <br />
          Grievance Officer: {COMPANY.grievanceOfficer}, {mail(COMPANY.grievanceEmail)}
        </p>
      ),
    },
  ],
};
