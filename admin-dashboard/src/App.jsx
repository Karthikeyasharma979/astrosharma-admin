import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Contacts from './pages/Contacts';
import useAuthStore from './store/authStore';
import './index.css';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
        />
        
        {/* Protected Dashboard Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="contacts" element={<Contacts />} />
        </Route>
        
        {/* Fallback - Only redirect if not a valid route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
