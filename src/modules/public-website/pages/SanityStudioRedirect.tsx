import { useEffect } from 'react';

const SanityStudioRedirect = () => {
    useEffect(() => {
        window.location.href = "https://emaktab-website.sanity.studio/";
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Redirecting to Content Studio...</h2>
                <p className="text-gray-600 mb-4">
                    You are being redirected to the Sanity Studio dashboard to manage your website content.
                </p>
                <p className="text-sm text-gray-500">
                    If you are not redirected automatically, <a href="https://emaktab-website.sanity.studio/" className="text-primary hover:underline font-medium">click here</a>.
                </p>
            </div>
        </div>
    );
};

export default SanityStudioRedirect;
