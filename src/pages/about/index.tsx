import React from 'react';

const About = () => {
    return (
        <div className='max-w-4xl mx-auto p-6 space-y-8'>
            {/* Hero Section */}
            <div className='text-center space-y-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-8'>
                <h1 className='text-4xl font-bold'>
                    🏆 EARN POINTS BY HELPING PEOPLE! 🏆
                </h1>
                <p className='text-xl opacity-90 max-w-3xl mx-auto'>
                    Kudos League is a platform created for people to give and receive help of any kind. 
                    We want to incentivize people to create better communities by helping each other.
                </p>
                <p className='text-lg font-semibold bg-white/20 rounded-lg p-3 inline-block'>
                    Each time you help someone, they can give you points (Kudos) as a reward!                
                </p>
            </div>

            {/* Free Platform Section */}
            <div className='bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border-l-4 border-green-500'>
                <h2 className='text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center'>
                    💰 WAIT, POINTS? DO I NEED TO PAY?
                </h2>
                <div className='text-2xl font-bold text-green-600 mb-4'>
                    Absolutely not!
                </div>
                <div className='space-y-3 text-gray-600 dark:text-gray-300'>
                    <p className='text-lg'>
                        You don&apos;t pay with your <strong>money</strong> OR your <strong>data</strong>.
                    </p>
                    <p>
                        We are a <span className='font-semibold text-blue-600'>non-profit</span> and we cover our costs through generous donations!
                    </p>
                    <p className='text-lg font-semibold text-green-600'>
                        That&apos;s it, no strings attached whatsoever!
                    </p>
                </div>
            </div>

            {/* How It Works */}
            <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-8'>
                <h2 className='text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center'>
                    🔧 HOW DOES THE SITE WORK?
                </h2>
                <p className='text-lg mb-6 text-gray-600 dark:text-gray-300'>
                    Glad you asked! Here&apos;s the simple process:
                </p>
                
                <div className='grid md:grid-cols-2 gap-6 mb-6'>
                    <div className='bg-blue-100 dark:bg-blue-900/30 rounded-lg p-6'>
                        <h3 className='text-xl font-semibold mb-3 text-blue-800 dark:text-blue-300 flex items-center'>
                            🙋‍♂️ ReQuest Help
                        </h3>
                        <p className='text-gray-700 dark:text-gray-300'>
                            Ask for help when you need something. Your post appears on the home page 
                            and people who can help will reach out to you!
                        </p>
                    </div>
                    
                    <div className='bg-green-100 dark:bg-green-900/30 rounded-lg p-6'>
                        <h3 className='text-xl font-semibold mb-3 text-green-800 dark:text-green-300 flex items-center'>
                            🎁 Gift Help
                        </h3>
                        <p className='text-gray-700 dark:text-gray-300'>
                            Offer help when you have something to give. People who need what 
                            you&apos;re offering will contact you!
                        </p>
                    </div>
                </div>

                <div className='bg-white dark:bg-gray-800 rounded-lg p-6'>
                    <h3 className='text-lg font-semibold mb-3 text-gray-900 dark:text-white'>
                        The Process:
                    </h3>
                    <ol className='space-y-2 text-gray-600 dark:text-gray-300'>
                        <li className='flex items-start'>
                            <span className='bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5'>1</span>
                            Create your post (ReQuest or Gift)
                        </li>
                        <li className='flex items-start'>
                            <span className='bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5'>2</span>
                            Receive notifications from interested people
                        </li>
                        <li className='flex items-start'>
                            <span className='bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5'>3</span>
                            Select who you want to help or receive help from
                        </li>
                        <li className='flex items-start'>
                            <span className='bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5'>4</span>
                            After receiving help, give Kudos points as a reward!
                        </li>
                    </ol>
                </div>
            </div>

            {/* Kudos Value Explanation */}
            <div className='bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg'>
                <h2 className='text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center'>
                    💧 HOW MUCH IS A POINT WORTH?
                </h2>
                <p className='text-lg mb-6 text-gray-600 dark:text-gray-300'>
                    Glad you asked! Let us explain with a simple analogy:
                </p>

                <div className='space-y-6'>
                    <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-l-4 border-blue-400'>
                        <h4 className='font-semibold mb-2 text-blue-800 dark:text-blue-300'>
                            🚰 Scenario 1: Not Thirsty
                        </h4>
                        <p className='text-gray-700 dark:text-gray-300'>
                            A stranger gives you water when you&apos;re not thirsty. Nice gesture, 
                            but not urgent. <span className='font-semibold'>Low Kudos</span>
                        </p>
                    </div>

                    <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border-l-4 border-yellow-400'>
                        <h4 className='font-semibold mb-2 text-yellow-800 dark:text-yellow-300'>
                            💧 Scenario 2: Thirsty & Can&apos;t Afford Water
                        </h4>
                        <p className='text-gray-700 dark:text-gray-300'>
                            A stranger gives you water when you&apos;re thirsty and broke. 
                            They saved your life! <span className='font-semibold'>More Kudos</span>
                        </p>
                    </div>

                    <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border-l-4 border-red-400'>
                        <h4 className='font-semibold mb-2 text-red-800 dark:text-red-300'>
                            🏜️ Scenario 3: Desert Emergency
                        </h4>
                        <p className='text-gray-700 dark:text-gray-300'>
                            You&apos;re dying of thirst in the desert. Someone crosses miles to bring you water, 
                            investing time and effort to save your life. <span className='font-semibold'>A LOT of Kudos!</span>
                        </p>
                    </div>
                </div>

                <div className='bg-green-100 dark:bg-green-900/20 rounded-lg p-4 mt-6'>
                    <p className='text-center font-semibold text-green-800 dark:text-green-300'>
                        💡 <strong>Reference Point:</strong> Donating $1 to our website = 1 Kudos
                    </p>
                </div>
            </div>

            {/* Current Status & Future Plans */}
            <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-8 border border-yellow-200 dark:border-yellow-800'>
                <h2 className='text-2xl font-bold mb-4 text-yellow-800 dark:text-yellow-300 flex items-center'>
                    ⚠️ Current Status & Future Plans
                </h2>
                <div className='space-y-4 text-gray-700 dark:text-gray-300'>
                    <p>
                        <strong>Right now:</strong> We are a small website with limited abuse prevention. 
                        However, if you&apos;re able to join, it means we really trust you - so you are completely free!
                    </p>
                    
                    <p>
                        <strong>Coming soon:</strong> We want to implement:
                    </p>
                    <ul className='list-disc list-inside ml-4 space-y-1'>
                        <li>A system of votes and data analysis</li>
                        <li>Better post recommendations</li>
                        <li>Penalties for unrealistic Kudos offers (like 1,000,000 Kudos for an apple or 1 Kudos for a Ferrari)</li>
                    </ul>
                    
                    <div className='bg-white dark:bg-gray-800 rounded-lg p-4 mt-4'>
                        <p className='text-sm'>
                            <strong>Note:</strong> You can edit the amount of Kudos you want to give at any time 
                            before the other person receives it. Mistakes happen, and we account for that!
                        </p>
                    </div>
                </div>
            </div>

            {/* Open Source */}
            <div className='bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-8 text-center'>
                <h2 className='text-3xl font-bold mb-4'>
                    🔓 WE ARE GOING FREE AND OPEN SOURCE
                </h2>
                <p className='text-xl mb-4 opacity-90'>
                    Everything is better when it&apos;s free!
                </p>
                <p className='text-lg font-semibold'>
                    We operate with full transparency under an open source license!
                </p>
            </div>
            <div className='bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 text-white rounded-lg p-8 text-center shadow-xl space-y-6'>
                <h2 className='text-4xl font-extrabold tracking-wider'>
                    🤝 COMMUNITY DRIVEN
                </h2>
                <p className='text-xl font-bold opacity-90'>
                    More Kudos = Higher chance of getting help!
                </p>
                <p className='text-lg opacity-85'>
                    We still think that those who need it most should receive more help but this is our way of saying thank you!
                </p>
                <p className='text-md opacity-75'>
                    That&apos;s how we believe communities should be built!
                </p>
            </div>


            {/* Call to Action */}
            <div className='text-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg p-8'>
                <h2 className='text-2xl font-bold mb-4'>
                    Ready to Join and Earn Kudos?
                </h2>
                <div className='space-x-4'>
                    <a 
                        href='/sign-up' 
                        className='inline-block bg-white text-emerald-600 px-6 py-2 rounded-lg font-bold hover:bg-emerald-50 transition-colors'
                    >
                        Join Now
                    </a>
                    <a 
                        href='/login' 
                        className='inline-block border-2 border-white text-white px-6 py-2 rounded-lg font-bold hover:bg-white hover:text-emerald-600 transition-colors'
                    >
                        Log In
                    </a>
                </div>
            </div>
        </div>
    );
};

export default About;