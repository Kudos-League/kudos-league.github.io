import React from 'react';

const Terms = () => {
    return (
        <div className='max-w-3xl mx-auto p-6 space-y-6 text-gray-700 dark:text-gray-300'>
            <h1 className='text-3xl font-bold text-zinc-900 dark:text-white'>
                Terms &amp; Conditions
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
                Last updated: placeholder. This is a draft document and does not
                yet constitute the final legal terms.
            </p>

            <section className='space-y-3'>
                <h2 className='text-xl font-semibold text-zinc-900 dark:text-white'>
                    1. Acceptance of Terms
                </h2>
                <p>
                    By creating an account and using Kudos League Foundation
                    (KLF), you agree to these Terms &amp; Conditions. If you do
                    not agree, please do not use the platform.
                </p>
            </section>

            <section className='space-y-3'>
                <h2 className='text-xl font-semibold text-zinc-900 dark:text-white'>
                    2. Using the Platform
                </h2>
                <p>
                    KLF is a community platform for giving and receiving help.
                    You agree to use it respectfully, to not post unlawful or
                    harmful content, and to follow community guidelines.
                </p>
            </section>

            <section className='space-y-3'>
                <h2 className='text-xl font-semibold text-zinc-900 dark:text-white'>
                    3. Kudos &amp; Rewards
                </h2>
                <p>
                    Kudos are points awarded within the platform and hold no
                    monetary value. KLF may adjust how kudos are earned or
                    awarded at any time.
                </p>
            </section>

            <section className='space-y-3'>
                <h2 className='text-xl font-semibold text-zinc-900 dark:text-white'>
                    4. Privacy
                </h2>
                <p>
                    We handle your data in accordance with our privacy
                    practices. A full privacy policy will be provided here.
                </p>
            </section>

            <section className='space-y-3'>
                <h2 className='text-xl font-semibold text-zinc-900 dark:text-white'>
                    5. Changes to These Terms
                </h2>
                <p>
                    We may update these terms from time to time. Continued use
                    of the platform after changes constitutes acceptance of the
                    updated terms.
                </p>
            </section>
        </div>
    );
};

export default Terms;
