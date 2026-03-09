export default function TermsPage() {
    return (
        <div className="min-h-screen pt-32 px-[4%] max-w-4xl mx-auto pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
            <div className="space-y-6 text-gray-300">
                <p>Welcome to FlixView. By accessing our website, you agree to be bound by these Terms of Service.</p>

                <h2 className="text-xl font-semibold text-white mt-8">1. Acceptance of Terms</h2>
                <p>FlixView provides a platform for streaming content. You agree to use the service only for lawful purposes.</p>

                <h2 className="text-xl font-semibold text-white mt-8">2. Content</h2>
                <p>We do not host any files on our servers. All content is provided by non-affiliated third parties.</p>

                <h2 className="text-xl font-semibold text-white mt-8">3. Disclaimer</h2>
                <p>The service is provided "as is" without warranties of any kind.</p>
            </div>
        </div>
    );
}
