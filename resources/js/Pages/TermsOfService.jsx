import { Head, Link, usePage } from '@inertiajs/react';
import { School } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SiteFooter from '@/Components/SiteFooter';

function Section({ title, children }) {
    return (
        <section className="mb-10">
            <h2 className="font-display text-2xl font-medium text-navy mb-3">{title}</h2>
            <div className="space-y-4 text-navy/75 leading-relaxed">{children}</div>
        </section>
    );
}

function TermsOfServiceBody() {
    return (
        <>
            <p className="text-navy/75 leading-relaxed mb-10">
                These Terms of Service ("Terms") govern access to and use of the SchoolMS platform
                ("Service"), operated by SchoolMS ("we," "us," "our"). By using the Service, you agree to
                these Terms.
            </p>

            <Section title="1. Accounts">
                <p>
                    SchoolMS does not offer public self-registration. Accounts are created and provisioned
                    exclusively by a School's administrator, who is responsible for assigning roles
                    (administrator, teacher, or guardian) and deactivating accounts when access should end.
                    You are responsible for keeping your login credentials confidential and for all
                    activity under your account.
                </p>
            </Section>

            <Section title="2. Acceptable Use">
                <p>You agree to use the Service only for its intended purpose of school administration and communication, and not to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>access or attempt to access data belonging to a School you are not authorized to access;</li>
                    <li>use the Service to upload unlawful, harmful, or infringing content;</li>
                    <li>attempt to disrupt, reverse-engineer, or circumvent the security of the Service;</li>
                    <li>use the Service in violation of applicable law.</li>
                </ul>
                <p>We may suspend or terminate accounts that violate these Terms.</p>
            </Section>

            <Section title="3. School Responsibility">
                <p>
                    Each School is responsible for the accuracy of the information it enters (including
                    student, guardian, and staff records) and for ensuring it has appropriate authority and
                    consent to enter that information into the Service.
                </p>
            </Section>

            <Section title="4. Fees">
                <p>
                    Where a School subscribes to a paid plan, applicable fees are as agreed at signup or as
                    published on our website, and are billed to the School, not to individual students or
                    guardians.
                </p>
            </Section>

            <Section title="5. Availability">
                <p>
                    We aim to keep the Service available and reliable but do not guarantee uninterrupted
                    access. The Service is provided "as is" and "as available," without warranties of any
                    kind, express or implied.
                </p>
            </Section>

            <Section title="6. Limitation of Liability">
                <p>
                    To the maximum extent permitted by law, SchoolMS shall not be liable for any indirect,
                    incidental, or consequential damages arising from use of, or inability to use, the
                    Service.
                </p>
            </Section>

            <Section title="7. Termination">
                <p>
                    We may suspend or terminate access to the Service for any account or School that
                    violates these Terms or applicable law. A School may also terminate its own use of the
                    Service at any time.
                </p>
            </Section>

            <Section title="8. Changes to These Terms">
                <p>
                    We may update these Terms from time to time. Continued use of the Service after changes
                    take effect constitutes acceptance of the revised Terms.
                </p>
            </Section>

            <Section title="9. Governing Law">
                <p>These Terms are governed by the laws of Kenya.</p>
            </Section>

            <Section title="10. Contact Us">
                <p>
                    Questions about these Terms can be sent to{' '}
                    <a href="mailto:info@school-ms.com" className="text-orange-dark font-medium hover:underline">
                        info@school-ms.com
                    </a>.
                </p>
            </Section>
        </>
    );
}

export default function TermsOfService() {
    const { auth } = usePage().props;

    if (auth?.user) {
        return (
            <AuthenticatedLayout header="Terms of Service">
                <Head title="Terms of Service - SchoolMS" />

                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow sm:rounded-lg sm:p-10">
                        <p className="text-navy/50 text-sm mb-10">Last updated: August 29, 2026</p>
                        <TermsOfServiceBody />
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <>
            <Head title="Terms of Service - SchoolMS" />

            <div className="min-h-screen bg-white font-sans text-navy">
                {/* ---------------------------------------------------------------- Nav */}
                <nav className="border-b border-navy/10 bg-cream/95">
                    <div className="max-w-3xl mx-auto px-6">
                        <div className="flex justify-between items-center h-18 py-4">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-navy rounded-md flex items-center justify-center">
                                    <School className="w-5 h-5 text-orange" />
                                </div>
                                <span className="text-lg font-display font-semibold tracking-tight text-navy">SchoolMS</span>
                            </Link>
                            <Link href="/" className="text-sm font-medium text-navy/70 hover:text-navy transition-colors">
                                Back to home
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* ---------------------------------------------------------------- Content */}
                <main className="max-w-3xl mx-auto px-6 py-16">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-dark mb-4">Legal</p>
                    <h1 className="font-display text-4xl font-medium text-navy mb-2">Terms of Service</h1>
                    <p className="text-navy/50 text-sm mb-12">Last updated: August 29, 2026</p>

                    <TermsOfServiceBody />
                </main>

                {/* ---------------------------------------------------------------- Footer */}
                <SiteFooter />
            </div>
        </>
    );
}
