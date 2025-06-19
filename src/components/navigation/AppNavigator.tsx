import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from '@/components/navigation/Layout';

import Home from '@/pages/home';

import Success from '@/pages/donate/sucess';
import Cancel from '@/pages/donate/cancel';

import Post from '@/pages/post';
import CreatePost from '@/pages/create-post';
import Profile from '@/pages/user';
import EventDetails from '@/pages/event';

import SignIn from '@/pages/login';
import SignUp from '@/pages/signup';

import EventsPage from '@/pages/events';

import DonatePage from '@/pages/donate';
import AdminDashboard from '@/pages/admin';

import CreateEvent from '@/components/events/CreateEvent';
import Leaderboard from '@/components/Leaderboard';
import DMChat from '@/components/messages/DMChat';
import PublicChat from '@/components/messages/PublicChat';

function AppNavigator() {
    return (
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
                <Route path ='/events' element={<EventsPage />} />
                <Route path='/create-event' element={<CreateEvent />} />

                <Route path='/chat' element={<PublicChat />} />
                <Route path='/dms' element={<DMChat />} />
                <Route path="/dms/:id?" element={<DMChat />} />
                <Route path='/leaderboard' element={<Leaderboard />} />
                <Route path='/admin' element={<AdminDashboard />} />

                <Route path='/login' element={<SignIn />} />
                <Route path='/sign-up' element={<SignUp />} />

                <Route path='*' element={<Navigate to='/' replace />} />
            </Route>
        </Routes>
    );
}

export default AppNavigator;
