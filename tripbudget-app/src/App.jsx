import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TripProvider, useTripContext } from './context/TripContext';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import Home from './pages/Home';
import Trips from './pages/Trips';
import CreateTrip from './pages/CreateTrip';
import AddMembers from './pages/AddMembers';
import TripDetail from './pages/TripDetail';
import AddExpense from './pages/AddExpense';
import ExpenseList from './pages/ExpenseList';
import ExpenseDetail from './pages/ExpenseDetail';
import Balance from './pages/Balance';
import Settlement from './pages/Settlement';
import './styles/global.css';

function AppContent() {
  const { toast } = useTripContext();

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/create" element={<CreateTrip />} />
        <Route path="/trips/:tripId" element={<TripDetail />} />
        <Route path="/trips/:tripId/members" element={<AddMembers />} />
        <Route path="/trips/:tripId/add-expense" element={<AddExpense />} />
        <Route path="/trips/:tripId/expenses" element={<ExpenseList />} />
        <Route path="/trips/:tripId/expenses/:expenseId" element={<ExpenseDetail />} />
        <Route path="/trips/:tripId/expenses/:expenseId/edit" element={<AddExpense />} />
        <Route path="/trips/:tripId/settlement" element={<Settlement />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/balance" element={<Balance />} />
      </Routes>
      <BottomNav />
      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </BrowserRouter>
  );
}
