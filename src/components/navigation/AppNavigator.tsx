import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './Layout';

const Home = lazy(() => import('@/pages/home'));
const Success = lazy(() => import('@/pages/donate/sucess'));
const Cancel = lazy(() => import('@/pages/donate/cancel'));
const Post = lazy(() => import('@/pages/post'));
const CreatePost = lazy(() => import('@/pages/create-post'));
const Profile = lazy(() => import('@/pages/user'));
const EventDetails = lazy(() => import('@/pages/event'));
const SignIn = lazy(() => import('@/pages/login'));
const SignUp = lazy(() => import('@/pages/signup'));
const EventsPage = lazy(() => import('@/pages/events'));
const DonatePage = lazy(() => import('@/pages/donate'));
const AdminDashboard = lazy(() => import('@/pages/admin'));

const CreateEvent = lazy(() => import('@/components/events/CreateEvent'));
const Leaderboard = lazy(() => import('@/components/Leaderboard'));
const DMChat = lazy(() => import('@/components/messages/DMChat'));
const PublicChat = lazy(() => import('@/components/messages/PublicChat'));


function AppNavigator() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <Routes>
                <Route path='' element={<Layout />}>
                    <Route path='/' element={<Home />} />
                    <Route path='/donate' element={<DonatePage />} />
                    <Route path='/success' element={<Success />} />
                    <Route path='/cancel' element={<Cancel />} />
                    <Route path='/post/:id' element={<Post />} />
                    <Route path='/create-post' element={<CreatePost />} />
                    <Route path='/user/:id' element={<Profile />} />
                    <Route path='/event/:id' element={<EventDetails />} />
                    <Route path='/events' element={<EventsPage />} />
                    <Route path='/create-event' element={<CreateEvent />} />
                    <Route path='/chat' element={<PublicChat />} />
                    <Route path='/dms' element={<DMChat />} />
                    <Route path='/dms/:id?' element={<DMChat />} />
                    <Route path='/leaderboard' element={<Leaderboard />} />
                    <Route path='/admin' element={<AdminDashboard />} />
                    <Route path='/login' element={<SignIn />} />
                    <Route path='/sign-up' element={<SignUp />} />
                    <Route path='*' element={<Navigate to='/' replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
}

export default AppNavigator;
