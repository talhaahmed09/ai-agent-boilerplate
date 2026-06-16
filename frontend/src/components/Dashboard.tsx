/**
 * Dashboard — authenticated view. Shows the user's email and a logout button.
 * Logout dispatches the synchronous `logout` action (clears Redux state) then
 * navigates to /login. No loading state is needed — session data is always
 * synchronously available after rehydration or login redirect (design §3, AC-24, AC-25).
 */
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/selectors/auth/authSelectors';
import { logout } from '../store/slices/auth/authSlice';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    void navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-8 py-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
      <p className="text-sm text-gray-500 mb-6">Signed in as {user?.email}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md text-sm"
      >
        Log out
      </button>
    </div>
  );
}
