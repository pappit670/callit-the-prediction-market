import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-3xl px-4 md:px-6 py-12 pb-24">
                <div className="mb-10">
                    <Link to="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">← Back to Callit</Link>
                    <h1 className="font-headline text-4xl font-bold text-foreground mt-4 mb-2">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
                </div>

                <div className="prose prose-sm max-w-none space-y-8 text-foreground">

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to Callit. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">2. Information We Collect</h2>
                        <p className="text-muted-foreground leading-relaxed mb-3">We collect information you provide directly to us, including:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Account information — username, email address, password</li>
                            <li>Profile information — bio, avatar</li>
                            <li>Activity data — opinions you create, calls you make, comments you post</li>
                            <li>Usage data — how you interact with the platform, pages visited, features used</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">3. How We Use Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed mb-3">We use the information we collect to:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Provide, maintain and improve the Callit platform</li>
                            <li>Process your calls and track your win/loss record</li>
                            <li>Send you notifications about opinions you've called on</li>
                            <li>Personalise your experience and show you relevant content</li>
                            <li>Monitor and analyse trends and usage of the platform</li>
                            <li>Detect and prevent fraudulent or abusive activity</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">4. Information Sharing</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We do not sell your personal information. We may share your information with third party service providers who help us operate the platform — including Supabase for database and authentication services. These providers are bound by contractual obligations to keep your information confidential and use it only for the purposes we specify.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">5. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorised access. All data is encrypted in transit and at rest. Authentication is handled securely through Supabase Auth.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">6. Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed mb-3">You have the right to:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Access the personal information we hold about you</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your account and associated data</li>
                            <li>Opt out of non-essential communications</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">7. Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use essential cookies and local storage to maintain your session and preferences such as dark mode. We do not use tracking or advertising cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">8. Changes to This Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the date at the top.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">9. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at{" "}
                            <a href="mailto:privacy@callit.app" className="text-gold hover:underline">privacy@callit.app</a>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;