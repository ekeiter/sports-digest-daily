import blimpLogo from "@/assets/sportsdig-blimp-logo.png";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#D5D5D5]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <img src={blimpLogo} alt="SportsDig" className="h-10" />
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6 text-sm text-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Privacy Policy</h1>
          <p className="text-center text-muted-foreground">Last updated: February 9, 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            <p>SportsDig ("we," "our," or "us") provides a personalized sports news platform available on the web and mobile applications. This Privacy Policy explains how we collect, use, and share information when you use SportsDig.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Information We Collect</h2>
            <h3 className="font-semibold">Information you provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information (such as email address, if you create an account)</li>
              <li>Preferences (teams, sports, or topics you choose to follow)</li>
            </ul>
            <h3 className="font-semibold mt-3">Automatically collected information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device and browser information</li>
              <li>IP address</li>
              <li>Pages viewed and interactions with the site or app</li>
              <li>Approximate location (derived from IP address)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Advertising & Analytics</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>SportsDig displays advertisements to support the service.</li>
              <li>We use Google AdSense on the web and Google AdMob in mobile apps.</li>
              <li>Google and its partners may use cookies or similar technologies to show ads based on:
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Your visits to this and other websites</li>
                  <li>Contextual information (such as the content you are viewing)</li>
                </ul>
              </li>
              <li>Users in the European Economic Area (EEA), the UK, and Switzerland are shown a consent message allowing them to manage advertising preferences.</li>
            </ul>
            <p className="mt-2">
              You can learn more about how Google uses data here:{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                https://policies.google.com/technologies/ads
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Cookies & Consent</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cookies may be used to personalize content and measure performance.</li>
              <li>Where required by law, we ask for consent before using certain cookies or advertising technologies.</li>
              <li>You may manage or withdraw consent at any time through the consent message shown on the site.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">How We Use Information</h2>
            <p>We use information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Deliver relevant sports content</li>
              <li>Improve site and app performance</li>
              <li>Measure usage and engagement</li>
              <li>Display advertisements</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Sharing of Information</h2>
            <p>We do not sell personal information. Information may be shared with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Service providers (such as hosting, analytics, and advertising partners)</li>
              <li>When required by law</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Data Security</h2>
            <p>We take reasonable steps to protect your information, but no method of transmission over the internet is 100% secure.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Children's Information</h2>
            <p>SportsDig is not intended for children under the age of 13, and we do not knowingly collect personal information from children.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at:{" "}
              <a href="mailto:info@sportsdig.com" className="text-primary underline">
                info@sportsdig.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
