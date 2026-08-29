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

function PrivacyPolicyBody() {
    return (
        <>
            <p className="text-navy/75 leading-relaxed mb-10">
                SchoolMS ("we," "us," "our") provides a school management platform used by educational
                institutions ("Schools") to manage students, staff, guardians, and related academic
                operations. This Privacy Policy explains what information is collected through the
                platform, how it is used, and how it is protected.
            </p>
            <p className="text-navy/75 leading-relaxed mb-10">
                SchoolMS is provided to Schools, and each School acts as the data controller for the
                information of its own students, guardians, and staff. We act as a data processor on the
                School's behalf for that information.
            </p>

            <Section title="1. Information We Collect">
                <p>
                    <strong className="text-navy">Account information</strong>, for every user of the
                    platform (administrators, teachers, guardians): name, email address, password (stored
                    encrypted), and role.
                </p>
                <p>
                    <strong className="text-navy">Student records</strong>, entered by school
                    administrators: full name, gender, date of birth, class/grade, enrollment date and
                    status, and a link to the student's guardian(s).
                </p>
                <p>
                    <strong className="text-navy">Guardian records</strong>: phone number, address,
                    occupation, and relationship to the student.
                </p>
                <p>
                    <strong className="text-navy">Teacher/staff records</strong>: phone number, address,
                    qualifications, subject specialization, and employment start date.
                </p>
                <p>
                    <strong className="text-navy">Academic records</strong>: attendance, exam results and
                    grades, and — for schools using the Quran tracking module — memorization progress,
                    homework, and teacher assessments.
                </p>
                <p>
                    <strong className="text-navy">Documents</strong>: files uploaded to the platform (e.g.
                    certificates, identification, or supporting records), along with their verification
                    status.
                </p>
                <p>
                    <strong className="text-navy">Health and safety records</strong>: where a school uses
                    the incident/accident reporting feature, records may include the nature of an incident,
                    medical attention required, and related notes. These are entered and controlled solely
                    by authorized school staff.
                </p>
                <p>
                    <strong className="text-navy">Financial records</strong>: fee invoices and payment
                    records tracked by the School (e.g. invoice amounts, due dates, and payment status) for
                    its own billing and record-keeping purposes.
                </p>
                <p>
                    <strong className="text-navy">Demo booking information</strong>: if you request a
                    product demo through our public website, we collect your name, email, phone number,
                    school name, and any message you provide. This is used only to schedule and confirm the
                    demo — it is entirely separate from, and never linked to, any student or school data
                    described above.
                </p>
            </Section>

            <Section title="2. How We Use Information">
                <p>Information is used to:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>provide and operate the platform's core functionality (enrollment, attendance, grading, fee management, communication, etc.) on behalf of the School that entered it;</li>
                    <li>authenticate users and enforce role-based access within their own School;</li>
                    <li>send transactional communications (e.g. account notices, fee invoices, demo confirmations);</li>
                    <li>maintain the security and integrity of the platform.</li>
                </ul>
                <p>
                    We do not use student, guardian, or staff data for advertising, and we do not sell
                    personal information to any third party.
                </p>
            </Section>

            <Section title="3. How Data Is Stored and Isolated">
                <p>
                    SchoolMS is a multi-tenant platform: all Schools share the same underlying system, but
                    every record is tied to a specific School and is only accessible to authorized users of
                    that School. Data belonging to one School is never visible to another School's users.
                </p>
                <p>
                    Data is stored in a secured, access-controlled database and is retained for as long as
                    the School's account remains active, or as long as required to comply with legal
                    obligations, after which it may be deleted or anonymized.
                </p>
            </Section>

            <Section title="4. Google Calendar Integration (Demo Bookings)">
                <p>
                    Our public website lets visitors request a live product demo. To manage demo
                    scheduling, our site connects to Google Calendar using <strong className="text-navy">our
                    own company Google account</strong> — not the visitor's, and not any school's or end
                    user's Google account. End users and schools are never asked to authorize or connect
                    their own Google account for this feature.
                </p>
                <p>
                    When you submit a demo request, the name, email, phone number, school name, and message
                    you provide are added as the description/attendee details of a calendar event on our
                    internal scheduling calendar, solely so we can confirm the meeting time and send a
                    Google Meet link. No student, guardian, or school operational data is ever sent to or
                    stored in Google Calendar.
                </p>
            </Section>

            <Section title="5. Who We Share Data With">
                <p>We do not share personal data with third parties except:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>Service providers who help us operate the platform (e.g. our email delivery provider, and Google Calendar/Meet solely for demo scheduling as described above), under obligations to protect it;</li>
                    <li>When required by law, such as in response to a valid legal request; or</li>
                    <li>With your consent, or at the direction of the School that controls the data.</li>
                </ul>
                <p>We do not sell personal information.</p>
            </Section>

            <Section title="6. Your Rights">
                <p>
                    If you are a student, guardian, or staff member of a School using SchoolMS and want to
                    access, correct, or request deletion of your information, please contact your School's
                    administrator directly, as they control your records. For questions about how SchoolMS
                    itself processes data, contact us using the details below.
                </p>
            </Section>

            <Section title="7. Children's Information">
                <p>
                    Because SchoolMS manages student records for schools, it necessarily processes
                    information about minors. This information is entered and controlled by the School (via
                    its administrators and teachers), not collected directly from children, and is never
                    used for marketing or shared for any purpose outside the School's own operations.
                </p>
            </Section>

            <Section title="8. Changes to This Policy">
                <p>
                    We may update this policy from time to time. Material changes will be reflected by
                    updating the "Last updated" date above.
                </p>
            </Section>

            <Section title="9. Contact Us">
                <p>
                    Questions about this Privacy Policy can be sent to{' '}
                    <a href="mailto:info@school-ms.com" className="text-orange-dark font-medium hover:underline">
                        info@school-ms.com
                    </a>.
                </p>
            </Section>
        </>
    );
}

export default function PrivacyPolicy() {
    const { auth } = usePage().props;

    if (auth?.user) {
        return (
            <AuthenticatedLayout header="Privacy Policy">
                <Head title="Privacy Policy - SchoolMS" />

                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow sm:rounded-lg sm:p-10">
                        <p className="text-navy/50 text-sm mb-10">Last updated: August 29, 2026</p>
                        <PrivacyPolicyBody />
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <>
            <Head title="Privacy Policy - SchoolMS" />

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
                    <h1 className="font-display text-4xl font-medium text-navy mb-2">Privacy Policy</h1>
                    <p className="text-navy/50 text-sm mb-12">Last updated: August 29, 2026</p>

                    <PrivacyPolicyBody />
                </main>

                {/* ---------------------------------------------------------------- Footer */}
                <SiteFooter />
            </div>
        </>
    );
}
