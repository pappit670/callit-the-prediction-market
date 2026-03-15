import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-3xl px-4 md:px-6 py-12 pb-24">
                <div className="mb-10">
                    <Link to="/" className="text-sm text-muted-foreground hover:text-gold transition-colors">← Back to Callit</Link>
                    <h1 className="font-headline text-4xl font-bold text-foreground mt-4 mb-2">Terms & Conditions</h1>
                    <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
                </div>

                <div className="space-y-8 text-foreground">

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using Callit, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the platform. These terms apply to all users of the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">2. What Callit Is</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Callit is an opinion prediction platform that allows users to make predictions on real-world events and track their accuracy. The platform uses CallPoints — a virtual in-platform currency with no real monetary value. Callit is not a gambling platform and does not involve real money wagering.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed mb-3">To use Callit you must:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Be at least 13 years of age</li>
                            <li>Provide accurate and complete registration information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Notify us immediately of any unauthorised use of your account</li>
                            <li>Be responsible for all activity that occurs under your account</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">4. Acceptable Use</h2>
                        <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>Post false, misleading, or harmful content</li>
                            <li>Harass, abuse, or threaten other users</li>
                            <li>Attempt to manipulate opinion outcomes or exploit the platform</li>
                            <li>Use automated scripts, bots, or other tools to access the platform</li>
                            <li>Post content that infringes on intellectual property rights</li>
                            <li>Impersonate any person or entity</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">5. CallPoints</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            CallPoints are virtual currency used within the Callit platform. They have no real monetary value and cannot be exchanged for real money or goods. CallPoints are awarded on signup and through platform activity. We reserve the right to adjust CallPoints balances at any time for reasons including abuse, technical issues, or policy changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">6. Opinion Resolution</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Opinions are resolved based on real-world outcomes, crowd consensus, or measurable metrics as specified at the time of creation. Callit reserves the right to void any opinion in cases of ambiguity, insufficient participation, or technical issues. All resolution decisions made by Callit are final.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">7. Content Ownership</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You retain ownership of content you create on Callit. By posting content, you grant Callit a non-exclusive, worldwide, royalty-free licence to use, display, and distribute your content on the platform. You are responsible for ensuring you have the right to share any content you post.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">8. Disclaimers</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Callit is provided "as is" without warranties of any kind. We do not guarantee the accuracy of any opinion outcomes or predictions. The platform is for entertainment and opinion tracking purposes only. Nothing on Callit constitutes financial, legal, or professional advice.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">9. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our sole discretion. Upon termination, your right to use the platform will immediately cease.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">10. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or an in-app notification.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-headline text-xl font-bold mb-3">11. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these Terms, contact us at{" "}
                            <a href="mailto:legal@callit.app" className="text-gold hover:underline">legal@callit.app</a>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditions;