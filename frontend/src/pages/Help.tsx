import React from 'react';
import { Book, LifeBuoy, FileCode, Search } from 'lucide-react';

const HelpPage: React.FC = () => {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Help & Support</h1>

            {/* Search */}
            <div className="relative mb-12">
                <Search className="absolute left-4 top-4 w-6 h-6 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search documentation, tutorials, and FAQs..."
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
                    <button className="text-blue-400 hover:text-blue-300 font-medium">Browse Docs →</button>
                </div>

                <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-colors p-8">
                    <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <FileCode className="w-6 h-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">API Reference</h3>
                    <p className="text-gray-400 mb-4">Detailed API documentation for developers.</p>
                    <button className="text-purple-400 hover:text-purple-300 font-medium">View API →</button>
                </div>

                <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-colors p-8">
                    <div className="bg-green-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                        <LifeBuoy className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Support</h3>
                    <p className="text-gray-400 mb-4">Get help from our support team.</p>
                    <button className="text-green-400 hover:text-green-300 font-medium">Contact Support →</button>
                </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {[
                        "How do I create a new project?",
                        "What is the difference between a Deployment and a BluePrint?",
                        "How is billing calculated?",
                        "Can I invite team members?"
                    ].map((faq, index) => (
                        <div key={index} className="bg-[#0f0f11] border border-gray-800/50 rounded-lg p-4 hover:bg-gray-800/30 transition-colors cursor-pointer flex justify-between items-center">
                            <span className="text-gray-300 font-medium">{faq}</span>
                            <span className="text-gray-500">+</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
