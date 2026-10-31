import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { setupFetchInterceptor } from './utils/apiClient';

// Initialize global fetch interceptor safely (handles read-only / getter-only window.fetch)
setupFetchInterceptor();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
