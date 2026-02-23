import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <h1 className="text-8xl font-serif text-[#0f172a] mb-4">404</h1>
                <p className="text-xl text-slate-500 mb-8 font-light">
                    Halaman yang Anda cari tidak ditemukan.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-[#0f172a] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
