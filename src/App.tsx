import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Login from './components/Login';
import Layout from './components/Layout';
import Booking from './components/Booking';
import MyBookings from './components/MyBookings';
import Exchange from './components/Exchange';
import Admin from './components/Admin';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('book');

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'book' && <Booking />}
      {currentTab === 'my' && <MyBookings />}
      {currentTab === 'exchange' && <Exchange />}
      {currentTab === 'admin' && <Admin />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
