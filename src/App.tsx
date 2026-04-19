import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AppErrorBoundary } from './components/AppErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  );
}
