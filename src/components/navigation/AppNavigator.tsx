import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './Layout';
import Spinner from '../common/Spinner';
import RequireAuth from './RequireAuth';
import PublicOnly from './PublicOnly';
import { routes } from '@/routes';
import About from '@/pages/about';

const Home = lazy(() => import('@/pages/home'));
const Post = lazy(() => import('@/pages/post'));
const CreatePost = lazy(() => import('@/pages/create-post'));
const Profile = lazy(() => import('@/pages/user'));
const EventDetails = lazy(() => import('@/pages/event'));
const SignIn = lazy(() => import('@/pages/login'));
const SignUp = lazy(() => import('@/pages/signup'));
const ForgotPassword = lazy(() => import('@/pages/forgot-password'));
const ResetPassword = lazy(() => import('@/pages/reset-password'));
const EventsPage = lazy(() => import('@/pages/events'));
const DonatePage = lazy(() => import('@/pages/donate'));
const AdminDashboard = lazy(() => import('@/pages/admin'));

const CreateEvent = lazy(() => import('@/components/events/CreateEvent'));
const Leaderboard = lazy(() => import('@/components/Leaderboard'));
const DMChat = lazy(() => import('@/components/messages/DMChat'));
const PublicChat = lazy(() => import('@/components/messages/PublicChat'));

function AppNavigator() {
    return (
        <Suspense fallback={<Spinner text='Loading app...' />}>
            <Routes>
                <Route path='' element={<Layout />}>
                    <Route path={routes.about} element={<About/>} />
                    <Route path={routes.home} element={<Home />} />

                    <Route
                        path={routes.donate}
                        element={
                            <RequireAuth>
                                <DonatePage />
                            </RequireAuth>
                        }
                    />

                    <Route
                        path='/post/:id'
                        element={
                            <RequireAuth>
                                <Post />
                            </RequireAuth>
                        }
                    />

                    <Route
                        path={routes.createPost}
                        element={
                            <RequireAuth>
                                <CreatePost />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path='/user/:id'
                        element={
                            <RequireAuth>
                                <Profile />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path='/event/:id'
                        element={
                            <RequireAuth>
                                <EventDetails />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path={routes.events}
                        element={
                            <RequireAuth>
                                <EventsPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path={routes.createEvent}
                        element={
                            <RequireAuth>
                                <CreateEvent />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path={routes.chat}
                        element={
                            <RequireAuth>
                                <PublicChat />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path={routes.dms}
                        element={
                            <RequireAuth>
                                <DMChat />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path='/dms/:id?'
                        element={
                            <RequireAuth>
                                <DMChat />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path={routes.leaderboard}
                        element={
                            <RequireAuth>
                                <Leaderboard />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path={routes.admin}
                        element={
                            <RequireAuth
                                allow={({ isLoggedIn, isAdmin }) =>
                                    isLoggedIn && isAdmin
                                }
                            >
                                <AdminDashboard />
                            </RequireAuth>
                        }
                    />

                    <Route
                        path={routes.login}
                        element={
                            <PublicOnly>
                                <SignIn />
                            </PublicOnly>
                        }
                    />
                    <Route
                        path={routes.signUp}
                        element={
                            <PublicOnly>
                                <SignUp />
                            </PublicOnly>
                        }
                    />
                    <Route
                        path={routes.forgotPassword}
                        element={
                            <PublicOnly>
                                <ForgotPassword />
                            </PublicOnly>
                        }
                    />
                    <Route
                        path={routes.resetPassword}
                        element={
                            <PublicOnly>
                                <ResetPassword />
                            </PublicOnly>
                        }
                    />

                    <Route
                        path='*'
                        element={<Navigate to={routes.home} replace />}
                    />
                </Route>
            </Routes>
        </Suspense>
    );
}

export default AppNavigator;
