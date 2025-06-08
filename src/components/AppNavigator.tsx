import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '@/pages/home';

import Success from '@/pages/donate/sucess';
import Cancel from '@/pages/donate/cancel';

import Post from '@/pages/post';
import CreatePost from '@/pages/create-post';
import Profile from '@/pages/user';
import CreateEvent from './events/CreateEvent';
import EventDetails from '@/pages/event';

import SignIn from '@/pages/login';
import SignUp from '@/pages/signup';

import Layout from './Layout';
import DMChat from './messages/DMChat';
import DonatePage from '@/pages/donate';
import Leaderboard from './Leaderboard';
import AdminDashboard from '@/pages/admin';
import PublicChat from './messages/PublicChat';
import EventsPage from './events/Events';

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
                <Route path='/event/:eventId' element={<EventDetails />} />
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
