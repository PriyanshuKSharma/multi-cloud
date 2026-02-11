import React from 'react';
import { Book, LifeBuoy, FileCode, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageGuide from '../components/ui/PageGuide';

type FAQItem = {
    question: string;
    answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
    {
        question: 'How do I create a new project?',
        answer:
            'Open Projects from the sidebar, click Create Project, add name/description, and save. New resources can then be assigned to that project.',
    },
    {
        question: 'What is the difference between a Deployment and a BluePrint?',
        answer:
            'A Blueprint is a reusable template/configuration. A Deployment is an actual execution run that provisions or changes infrastructure using those settings.',
    },
    {
        question: 'How is billing calculated?',
        answer:
            'Billing views aggregate provider cost data and your provisioned resource metadata. Estimates are grouped by provider/service and updated when sync jobs refresh inventory.',
    },
    {
        question: 'Can I invite team members?',
        answer:
            'Team management is not enabled yet in this build. You can currently operate per authenticated user account and separate work by projects.',
    },
];

const HelpPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

    const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    const swaggerUrl = `${apiBaseUrl}/docs`;
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@cloudorch.com';

    const filteredFaqs = React.useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
            return FAQ_ITEMS.map((item, index) => ({ item, index }));
        }
        return FAQ_ITEMS.map((item, index) => ({ item, index })).filter(({ item }) =>
            `${item.question} ${item.answer}`.toLowerCase().includes(query)
        );
    }, [searchTerm]);

    const openDocs = () => navigate('/docs');

    const openApiDocs = () => {
        window.open(swaggerUrl, '_blank', 'noopener,noreferrer');
    };

    const contactSupport = () => {
        const subject = encodeURIComponent('Nebula Support Request');
        const body = encodeURIComponent('Hi team,\n\nI need help with:\n');
        window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    };

    const toggleFaq = (index: number) => {
        setOpenFaqIndex((prev) => (prev === index ? null : index));
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Help & Support</h1>

            <PageGuide
                title="About Help & Support"
                purpose="Help & Support is your entry point for docs, API references, and operational guidance."
                actions={[
                    'search knowledge base content',
                    'open documentation and API resources',
                    'reach support channels for unresolved issues',
                ]}
            />

            {/* Search */}
            <div className="relative mb-12">
                <Search className="absolute left-4 top-4 w-6 h-6 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search documentation, tutorials, and FAQs..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-[#0f0f11] border border-gray-800 rounded-xl text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg"
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-colors p-8">
                    <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <Book className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Documentation</h3>
                    <p className="text-gray-400 mb-4">Comprehensive guides to help you get started.</p>
                    <button
                        onClick={openDocs}
                        className="cursor-pointer inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium"
                    >
                        <span>Browse Docs</span>
                        <span>→</span>
                    </button>
                </div>

                <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-colors p-8">
                    <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <FileCode className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">API Reference</h3>
                    <p className="text-gray-400 mb-4">Detailed API documentation for developers.</p>
                    <button
                        onClick={openApiDocs}
                        className="cursor-pointer inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-medium"
                    >
                        <span>View API</span>
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-colors p-8">
                    <div className="bg-green-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <LifeBuoy className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Support</h3>
                    <p className="text-gray-400 mb-4">Get help from our support team.</p>
                    <button
                        onClick={contactSupport}
                        className="cursor-pointer inline-flex items-center space-x-2 text-green-400 hover:text-green-300 font-medium"
                    >
                        <span>Contact Support</span>
                        <span>→</span>
                    </button>
                </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {filteredFaqs.length === 0 && (
                        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-lg p-5 text-gray-400">
                            No results found for <span className="text-gray-200">&quot;{searchTerm}&quot;</span>.
                        </div>
                    )}

                    {filteredFaqs.map(({ item, index }) => {
                        const isOpen = openFaqIndex === index;
                        return (
                            <div key={item.question} className="bg-[#0f0f11] border border-gray-800/50 rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    className="cursor-pointer w-full p-4 hover:bg-gray-800/30 transition-colors flex justify-between items-center text-left"
                                >
                                    <span className="text-gray-300 font-medium pr-3">{item.question}</span>
                                    {isOpen ? (
                                        <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                                    )}
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 text-sm text-gray-400 border-t border-gray-800/50">
                                        <p className="pt-3">{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
